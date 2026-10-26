import { encodeFunctionResult, parseAbi } from "viem";
import { describe, expect, it } from "vitest";
import { botscanAdapter } from "./botscan";
import { rpcAdapter } from "./rpc";
import { formatUnits, type AdapterDeps } from "./types";

const ADDR = "0x6916414F7e390af45c29c89b0aC1Aa79c568D09D" as const;
const NOW = new Date("2026-10-19T12:00:00Z");

type Route = (url: string, init?: RequestInit) => Response | Promise<Response>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const deps = (route: Route): AdapterDeps => ({
  fetch: (async (input: RequestInfo | URL, init?: RequestInit) => route(String(input), init)) as typeof fetch,
  now: () => NOW,
  timeoutMs: 8000,
});

// ---------- BOTScan ----------

const scanRoutes = (overrides: Record<string, () => Response> = {}): Route => (url) => {
  for (const [k, f] of Object.entries(overrides)) if (url.endsWith(k)) return f();
  if (url.endsWith(`/addresses/${ADDR}`)) return json({ is_contract: true, is_verified: true, name: "BOWETH" });
  if (url.endsWith(`/tokens/${ADDR}/counters`)) return json({ token_holders_count: "29", transfers_count: "1280" });
  if (url.endsWith(`/tokens/${ADDR}`))
    return json({ name: "Wrapped ETH", symbol: "BOWETH", decimals: "18", total_supply: "1500000000000000000000", type: "ERC-20", exchange_rate: "4955.8" });
  return json({ message: "Not found" }, 404);
};

describe("BOTScan adapter", () => {
  it("maps a verified ERC-20 into live records with links", async () => {
    const r = await botscanAdapter(ADDR, "botchain", deps(scanRoutes()));
    expect(r.error).toBeUndefined();
    expect(r.asset).toMatchObject({ name: "Wrapped ETH", symbol: "BOWETH", decimals: 18, standard: "ERC-20", isContract: true });
    const by = Object.fromEntries(r.records.map((x) => [x.metricName, x]));
    expect(by["Contract verification"]).toMatchObject({ value: "Verified", status: "live", chainId: 677 });
    expect(by["Holder count"]).toMatchObject({ value: "29", unit: "holders", status: "live" });
    expect(by["Total transfers"]).toMatchObject({ value: "1,280", unit: "all time" });
    expect(by["Total supply"]).toMatchObject({ value: "1,500", unit: "BOWETH" });
    expect(by["Holder count"].sourceUrl).toBe(`https://scan.botchain.ai/token/${ADDR}`);
    expect(r.records.every((x) => x.collectedAt === NOW.toISOString())).toBe(true);
  });

  it("never turns the undocumented exchange rate into a price", async () => {
    const r = await botscanAdapter(ADDR, "botchain", deps(scanRoutes()));
    expect(r.records.some((x) => /price|rate/i.test(x.metricName))).toBe(false);
  });

  it("uses the mainnet explorer for mainnet", async () => {
    const seen: string[] = [];
    await botscanAdapter(ADDR, "botchain", deps((u) => (seen.push(u), scanRoutes()(u))));
    expect(seen.every((u) => u.startsWith("https://scan.botchain.ai/api/v2/"))).toBe(true);
  });

  it("reports an unknown address as not found, with no records", async () => {
    const r = await botscanAdapter(ADDR, "botchain", deps(scanRoutes({ [`/addresses/${ADDR}`]: () => json({ message: "Not found" }, 404) })));
    expect(r).toMatchObject({ records: [], error: { code: "not-found" } });
  });

  it("reports a wallet as not a contract", async () => {
    const r = await botscanAdapter(ADDR, "botchain", deps(scanRoutes({ [`/addresses/${ADDR}`]: () => json({ is_contract: false }) })));
    expect(r.error?.code).toBe("not-contract");
    expect(r.asset?.isContract).toBe(false);
  });

  it("marks token metrics unavailable for a contract that is not a token", async () => {
    const r = await botscanAdapter(
      ADDR,
      "botchain",
      deps(scanRoutes({ [`/tokens/${ADDR}`]: () => json({}, 404), [`/tokens/${ADDR}/counters`]: () => json({}, 404) })),
    );
    const holders = r.records.find((x) => x.metricName === "Holder count");
    expect(holders).toMatchObject({ status: "unavailable", value: "", errorCode: "Not a token contract on BOTScan" });
    expect(r.records.find((x) => x.metricName === "Contract verification")?.status).toBe("live");
  });

  it("marks a missing counter unavailable instead of zero", async () => {
    const r = await botscanAdapter(ADDR, "botchain", deps(scanRoutes({ [`/tokens/${ADDR}/counters`]: () => json({}) })));
    const transfers = r.records.find((x) => x.metricName === "Total transfers");
    expect(transfers).toMatchObject({ status: "unavailable", value: "" });
  });

  it("turns server errors, timeouts and bad JSON into adapter errors", async () => {
    const http = await botscanAdapter(ADDR, "botchain", deps(() => json({}, 503)));
    expect(http.error).toMatchObject({ code: "http" });
    const timeout = await botscanAdapter(ADDR, "botchain", deps(() => Promise.reject(Object.assign(new Error("t"), { name: "TimeoutError" }))));
    expect(timeout.error).toMatchObject({ code: "timeout", message: "Did not answer in time." });
    const bad = await botscanAdapter(ADDR, "botchain", deps(() => new Response("<html>", { status: 200 })));
    expect(bad.error?.code).toBe("malformed");
    for (const r of [http, timeout, bad]) expect(r.records).toEqual([]);
  });
});

// ---------- RPC ----------

const ERC20 = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
]);

type Call = { id: number; method: string; params: unknown[] };
function rpcRoute(answer: (c: Call) => { result?: unknown; error?: { code: number; message: string } }): Route {
  return async (_url, init) => {
    const calls = JSON.parse(String(init?.body)) as Call[];
    return json(calls.map((c) => ({ jsonrpc: "2.0", id: c.id, ...answer(c) })).reverse()); // out of order on purpose
  };
}

const tokenChain = (c: Call) => {
  if (c.method === "eth_getBlockByNumber") return { result: { number: "0x1a2b3c", timestamp: "0x68f4d000" } };
  if (c.method === "eth_getCode") return { result: "0x6080" };
  const data = (c.params[0] as { data: string }).data;
  const fn = (["name", "symbol", "decimals", "totalSupply"] as const).find((f) =>
    data.startsWith({ name: "0x06fdde03", symbol: "0x95d89b41", decimals: "0x313ce567", totalSupply: "0x18160ddd" }[f]),
  )!;
  const value = { name: "Wrapped ETH", symbol: "BOWETH", decimals: 6, totalSupply: BigInt("123456789000") }[fn];
  return { result: encodeFunctionResult({ abi: ERC20, functionName: fn, result: value as never }) };
};

describe("BOT Chain RPC adapter", () => {
  it("reads the token at one block and uses the block time as the source time", async () => {
    const r = await rpcAdapter(ADDR, "botchain", deps(rpcRoute(tokenChain)));
    expect(r.error).toBeUndefined();
    expect(r.asset).toMatchObject({ name: "Wrapped ETH", symbol: "BOWETH", decimals: 6, isContract: true });
    const [supply] = r.records;
    expect(supply).toMatchObject({ metricName: "Total supply", value: "123,456.789", unit: "BOWETH", status: "live", chainId: 677 });
    expect(supply.sourceTimestamp).toBe(new Date(0x68f4d000 * 1000).toISOString());
    expect(supply.sourceLabel).toBe("BOT Chain RPC, block 1,715,004");
  });

  it("pins every call to the same block", async () => {
    const tags: unknown[] = [];
    await rpcAdapter(ADDR, "botchain", deps(rpcRoute((c) => (c.method !== "eth_getBlockByNumber" && tags.push(c.params[1]), tokenChain(c)))));
    expect(new Set(tags)).toEqual(new Set(["0x1a2b3c"]));
  });

  it("reports an address without code as not a contract", async () => {
    const r = await rpcAdapter(ADDR, "botchain", deps(rpcRoute((c) => (c.method === "eth_getCode" ? { result: "0x" } : tokenChain(c)))));
    expect(r.error?.code).toBe("not-contract");
    expect(r.records).toEqual([]);
  });

  it("marks supply unavailable when the contract is not ERC-20", async () => {
    const r = await rpcAdapter(
      ADDR,
      "botchain",
      deps(rpcRoute((c) => (c.method === "eth_call" ? { error: { code: 3, message: "execution reverted" } } : tokenChain(c)))),
    );
    expect(r.records[0]).toMatchObject({ status: "unavailable", value: "" });
    expect(r.records[0].errorCode).toMatch(/does not answer/);
  });

  it("treats a non-batch reply as malformed", async () => {
    const r = await rpcAdapter(ADDR, "botchain", deps(() => json({ jsonrpc: "2.0", result: "0x1" })));
    expect(r.error?.code).toBe("malformed");
  });
});

describe("formatUnits", () => {
  it("groups thousands and trims trailing zeros", () => {
    expect(formatUnits(BigInt("1234567000000000000000"), 18)).toBe("1,234.567");
    expect(formatUnits(BigInt(1500), 0)).toBe("1,500");
    expect(formatUnits(BigInt("1000000000000000000"), 18)).toBe("1");
    expect(formatUnits(BigInt(1), 18)).toBe("0");
  });
});
