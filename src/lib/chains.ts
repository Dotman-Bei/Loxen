// BOT Chain network values. Re-verify against the official developer guide before deploying:
// https://dev-docs.botchain.ai/docs/Developers/quick-guide/
// The registry address is configuration, never hardcoded.

export type ChainConfig = {
  id: number;
  name: string;
  rpcUrl: string;
  explorer: string;
};

export const BOT_MAINNET: ChainConfig = {
  id: 677,
  name: "BOT Chain mainnet",
  rpcUrl: "https://rpc.botchain.ai",
  explorer: "https://scan.botchain.ai",
};

export const BOT_TESTNET: ChainConfig = {
  id: 968,
  name: "BOT Chain testnet",
  rpcUrl: "https://rpc.bohr.life",
  explorer: "https://scan.bohr.life",
};

/** A local Anvil node, for development and end-to-end tests only. */
export const LOCAL_CHAIN: ChainConfig = {
  id: 31337,
  name: "Local test chain",
  rpcUrl: process.env.NEXT_PUBLIC_LOXEN_LOCAL_RPC ?? "http://127.0.0.1:8545",
  explorer: "",
};

const CHAIN = process.env.NEXT_PUBLIC_LOXEN_CHAIN;
export const TARGET_CHAIN: ChainConfig = CHAIN === "mainnet" ? BOT_MAINNET : CHAIN === "local" ? LOCAL_CHAIN : BOT_TESTNET;

const rawRegistry = process.env.NEXT_PUBLIC_LOXEN_REGISTRY_ADDRESS ?? "";
export const REGISTRY_ADDRESS: `0x${string}` | null = /^0x[0-9a-fA-F]{40}$/.test(rawRegistry)
  ? (rawRegistry as `0x${string}`)
  : null;

export function chainName(id: number | null | undefined) {
  if (id == null) return "No network";
  if (id === BOT_MAINNET.id) return BOT_MAINNET.name;
  if (id === BOT_TESTNET.id) return BOT_TESTNET.name;
  if (id === LOCAL_CHAIN.id) return LOCAL_CHAIN.name;
  return `Chain ${id}`;
}

export function chainById(id: number | null | undefined): ChainConfig {
  if (id === BOT_MAINNET.id) return BOT_MAINNET;
  if (id === BOT_TESTNET.id) return BOT_TESTNET;
  if (id === LOCAL_CHAIN.id) return LOCAL_CHAIN;
  return TARGET_CHAIN;
}

/** Explorer links, or null for a chain with no explorer (a local test chain). */
export function txUrl(hash: string, chain: ChainConfig = TARGET_CHAIN): string | null {
  return chain.explorer ? `${chain.explorer}/tx/${hash}` : null;
}
export function addressUrl(address: string, chain: ChainConfig = TARGET_CHAIN): string | null {
  return chain.explorer ? `${chain.explorer}/address/${address}` : null;
}
