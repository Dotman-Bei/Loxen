// Runs the enabled adapters for one asset, with a short cache and per-provider health.
// State lives in this server process only: it resets on restart and is never written to disk.

import { enabledProviderIds } from "@/lib/providers";
import type { Evidence } from "@/lib/schema";
import { BOTSCAN_ID, botscanAdapter } from "./botscan";
import { RPC_ID, rpcAdapter } from "./rpc";
import type { Adapter, AdapterDeps, AdapterError, AdapterResult, ProviderNetwork, ResolvedAsset } from "./types";

export const ADAPTERS: Record<string, Adapter> = { [BOTSCAN_ID]: botscanAdapter, [RPC_ID]: rpcAdapter };

export const CACHE_TTL_MS = 60_000;
export const TIMEOUT_MS = 8_000;

type Health = { lastSuccess: string | null; lastError: { at: string; message: string } | null };
type ProviderState = { health: Map<string, Health>; cache: Map<string, { at: number; result: AdapterResult }> };

// One state per server process. Route handlers can be bundled separately, so module-level maps
// would not be shared between /api/evidence and /api/providers; a global singleton is.
const g = globalThis as typeof globalThis & { __loxenProviders?: ProviderState };
const state: ProviderState = (g.__loxenProviders ??= { health: new Map(), cache: new Map() });
const { health, cache } = state;

export type ProviderOutcome = {
  providerId: string;
  served: "live" | "cache" | "error";
  error?: AdapterError;
};

export type EvidenceResponse = {
  network: ProviderNetwork;
  address: string;
  asset: ResolvedAsset | null;
  records: Evidence[];
  outcomes: ProviderOutcome[];
  fetchedAt: string;
};

function key(id: string, network: string, address: string) {
  return `${id}:${network}:${address.toLowerCase()}`;
}

function note(id: string, result: AdapterResult, now: Date) {
  const h = health.get(id) ?? { lastSuccess: null, lastError: null };
  // A "not a contract / not found" answer is a successful reply about the address, not an outage.
  if (!result.error || result.error.code === "not-contract" || result.error.code === "not-found") h.lastSuccess = now.toISOString();
  else h.lastError = { at: now.toISOString(), message: result.error.message };
  health.set(id, h);
}

export async function fetchEvidence(
  address: `0x${string}`,
  network: ProviderNetwork,
  deps: Partial<AdapterDeps> = {},
): Promise<EvidenceResponse> {
  const d: AdapterDeps = { fetch: deps.fetch ?? fetch, now: deps.now ?? (() => new Date()), timeoutMs: deps.timeoutMs ?? TIMEOUT_MS };
  const ids = enabledProviderIds().filter((id) => ADAPTERS[id]);
  const now = d.now();

  const results = await Promise.all(
    ids.map(async (id): Promise<{ result: AdapterResult; served: ProviderOutcome["served"] }> => {
      const k = key(id, network, address);
      const hit = cache.get(k);
      if (hit && now.getTime() - hit.at < CACHE_TTL_MS) {
        // Served from cache: the same values, marked cached, with their original collection time.
        return {
          served: "cache",
          result: { ...hit.result, records: hit.result.records.map((r) => (r.status === "live" ? { ...r, status: "cached" } : r)) },
        };
      }
      const result = await ADAPTERS[id](address, network, d);
      note(id, result, now);
      const outage = result.error && result.error.code !== "not-contract" && result.error.code !== "not-found";
      if (!outage) cache.set(k, { at: now.getTime(), result });
      return { result, served: result.error ? "error" : "live" };
    }),
  );

  // Asset: prefer what the contract itself says (RPC), fill gaps from BOTScan. Never merge two
  // different names silently: if they disagree, keep the RPC value and report BOTScan's as a record.
  const rpc = results.find((r) => r.result.providerId === RPC_ID)?.result.asset;
  const scan = results.find((r) => r.result.providerId === BOTSCAN_ID)?.result.asset;
  const asset: ResolvedAsset | null =
    rpc || scan
      ? {
          address,
          isContract: rpc?.isContract ?? scan?.isContract,
          name: rpc?.name ?? scan?.name,
          symbol: rpc?.symbol ?? scan?.symbol,
          decimals: rpc?.decimals ?? scan?.decimals,
          standard: scan?.standard,
        }
      : null;

  return {
    network,
    address,
    asset,
    records: results.flatMap((r) => r.result.records),
    outcomes: results.map((r) => ({ providerId: r.result.providerId, served: r.served, error: r.result.error })),
    fetchedAt: now.toISOString(),
  };
}

export function providerHealth() {
  return enabledProviderIds()
    .filter((id) => ADAPTERS[id])
    .map((id) => ({ id, ...(health.get(id) ?? { lastSuccess: null, lastError: null }) }));
}

/** Test hook: forget cached results and health. */
export function resetProviderState() {
  cache.clear();
  health.clear();
}
