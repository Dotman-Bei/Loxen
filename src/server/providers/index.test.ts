import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_TTL_MS, fetchEvidence, providerHealth, resetProviderState } from "./index";
import { createLimiter } from "../rateLimit";

const ADDR = "0x6916414F7e390af45c29c89b0aC1Aa79c568D09D" as const;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

// A healthy BOTScan; an RPC that can be told to fail.
function world(opts: { rpcDown?: boolean; supplyRpc?: string } = {}) {
  let calls = 0;
  const f = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls++;
    const url = String(input);
    if (url.includes("/api/v2/addresses/")) return json({ is_contract: true, is_verified: true });
    if (url.endsWith("/counters")) return json({ token_holders_count: "29", transfers_count: "128" });
    if (url.includes("/api/v2/tokens/")) return json({ name: "T", symbol: "T", decimals: "0", total_supply: "1000", type: "ERC-20" });
    if (opts.rpcDown) throw Object.assign(new Error("t"), { name: "TimeoutError" });
    const batch = JSON.parse(String(init?.body)) as { id: number; method: string; params: { data?: string }[] }[];
    return json(
      batch.map((c) => {
        if (c.method === "eth_getBlockByNumber") return { id: c.id, result: { number: "0x10", timestamp: "0x10" } };
        if (c.method === "eth_getCode") return { id: c.id, result: "0x60" };
        const sel = c.params[0].data!.slice(0, 10);
        const word = (n: bigint) => "0x" + n.toString(16).padStart(64, "0");
        if (sel === "0x313ce567") return { id: c.id, result: word(BigInt(0)) };
        if (sel === "0x18160ddd") return { id: c.id, result: word(BigInt(opts.supplyRpc ?? "1000")) };
        return { id: c.id, error: { code: 3, message: "reverted" } };
      }),
    );
  }) as typeof fetch;
  return { f, count: () => calls };
}

describe("provider orchestration", () => {
  let clock = Date.parse("2026-10-19T12:00:00Z");
  const now = () => new Date(clock);
  beforeEach(() => {
    resetProviderState();
    clock = Date.parse("2026-10-19T12:00:00Z");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("collects records from both providers and resolves the asset", async () => {
    const w = world();
    const r = await fetchEvidence(ADDR, "botchain", { fetch: w.f, now });
    expect(r.outcomes.map((o) => [o.providerId, o.served])).toEqual([
      ["botscan", "live"],
      ["botchain-rpc", "live"],
    ]);
    expect(r.records.filter((x) => x.metricName === "Total supply")).toHaveLength(2);
    expect(r.asset).toMatchObject({ isContract: true, standard: "ERC-20" });
  });

  it("serves a repeat within the TTL from cache, marked cached, without calling out", async () => {
    const w = world();
    await fetchEvidence(ADDR, "botchain", { fetch: w.f, now });
    const before = w.count();
    clock += CACHE_TTL_MS - 1000;
    const r = await fetchEvidence(ADDR, "botchain", { fetch: w.f, now });
    expect(w.count()).toBe(before);
    expect(r.outcomes.every((o) => o.served === "cache")).toBe(true);
    expect(r.records.filter((x) => x.status !== "unavailable").every((x) => x.status === "cached")).toBe(true);
    // the collection time is the original read, not the cache hit
    expect(r.records[0].collectedAt).toBe("2026-10-19T12:00:00.000Z");
  });

  it("reads again after the TTL", async () => {
    const w = world();
    await fetchEvidence(ADDR, "botchain", { fetch: w.f, now });
    const before = w.count();
    clock += CACHE_TTL_MS + 1;
    const r = await fetchEvidence(ADDR, "botchain", { fetch: w.f, now });
    expect(w.count()).toBeGreaterThan(before);
    expect(r.outcomes.every((o) => o.served === "live")).toBe(true);
  });

  it("does not cache an outage, and records it in health", async () => {
    const down = world({ rpcDown: true });
    const r = await fetchEvidence(ADDR, "botchain", { fetch: down.f, now });
    expect(r.outcomes.find((o) => o.providerId === "botchain-rpc")).toMatchObject({ served: "error", error: { code: "timeout" } });
    const h = providerHealth().find((p) => p.id === "botchain-rpc");
    expect(h?.lastError?.message).toBe("Did not answer in time.");
    // the next call tries again instead of serving the failure
    const up = world();
    const again = await fetchEvidence(ADDR, "botchain", { fetch: up.f, now });
    expect(again.outcomes.find((o) => o.providerId === "botchain-rpc")?.served).toBe("live");
  });

  it("returns both disagreeing supplies so the brief can flag the conflict", async () => {
    const w = world({ supplyRpc: "1100" });
    const r = await fetchEvidence(ADDR, "botchain", { fetch: w.f, now });
    expect(r.records.filter((x) => x.metricName === "Total supply").map((x) => x.value).sort()).toEqual(["1,000", "1,100"]);
  });

  it("runs only the providers switched on", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOXEN_PROVIDERS", "botscan");
    const r = await fetchEvidence(ADDR, "botchain", { fetch: world().f, now });
    expect(r.outcomes.map((o) => o.providerId)).toEqual(["botscan"]);
    expect(providerHealth().map((p) => p.id)).toEqual(["botscan"]);
  });
});

describe("rate limiter", () => {
  it("allows the limit per window, then refuses with a retry time", () => {
    const allow = createLimiter(3, 60_000);
    const t = 1_000_000;
    expect([allow("a", t), allow("a", t), allow("a", t)].every((x) => x.ok)).toBe(true);
    expect(allow("a", t + 10_000)).toEqual({ ok: false, retryAfterS: 50 });
    expect(allow("b", t).ok).toBe(true);
    expect(allow("a", t + 60_000).ok).toBe(true);
  });
});
