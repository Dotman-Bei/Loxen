// Provider adapter contract. Each adapter is isolated: it parses only its own source, never invents
// a value, and reports a failure as an error with a safe description instead of an empty or zero value.

import type { Evidence } from "@/lib/schema";

export type ProviderNetwork = "botchain" | "bohr";

export type ResolvedAsset = {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  standard?: string;
  isContract?: boolean;
};

export type AdapterError = { code: "timeout" | "not-found" | "not-contract" | "http" | "malformed" | "network"; message: string };

export type AdapterResult = {
  providerId: string;
  records: Evidence[];
  asset?: ResolvedAsset;
  error?: AdapterError;
};

export type AdapterDeps = {
  fetch: typeof fetch;
  now: () => Date;
  timeoutMs: number;
};

export type Adapter = (address: `0x${string}`, network: ProviderNetwork, deps: AdapterDeps) => Promise<AdapterResult>;

export const NETWORK_INFO: Record<ProviderNetwork, { chainId: number; rpc: string; explorer: string }> = {
  botchain: { chainId: 677, rpc: "https://rpc.botchain.ai", explorer: "https://scan.botchain.ai" },
  bohr: { chainId: 968, rpc: "https://rpc.bohr.life", explorer: "https://scan.bohr.life" },
};

export function adapterError(e: unknown): AdapterError {
  const name = (e as { name?: string }).name;
  if (name === "TimeoutError" || name === "AbortError") return { code: "timeout", message: "Did not answer in time." };
  if (e instanceof SyntaxError) return { code: "malformed", message: "Returned a response Loxen could not read." };
  return { code: "network", message: "Could not be reached." };
}

let seq = 0;
export function recordId(providerId: string) {
  seq = (seq + 1) % 1_000_000;
  return `${providerId}_${Date.now().toString(36)}${seq.toString(36)}`;
}

/** Formats a raw integer amount with its decimals, grouped, at most 4 fractional digits. */
export function formatUnits(raw: bigint, decimals: number): string {
  const neg = raw < BigInt(0);
  const abs = neg ? -raw : raw;
  const base = BigInt(10) ** BigInt(decimals);
  const whole = abs / base;
  let frac = (abs % base).toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
  if (decimals === 0) frac = "";
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + grouped + (frac ? "." + frac : "");
}
