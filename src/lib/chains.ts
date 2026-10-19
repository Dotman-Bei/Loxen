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

export const TARGET_CHAIN: ChainConfig =
  process.env.NEXT_PUBLIC_LOXEN_CHAIN === "mainnet" ? BOT_MAINNET : BOT_TESTNET;

const rawRegistry = process.env.NEXT_PUBLIC_LOXEN_REGISTRY_ADDRESS ?? "";
export const REGISTRY_ADDRESS: `0x${string}` | null = /^0x[0-9a-fA-F]{40}$/.test(rawRegistry)
  ? (rawRegistry as `0x${string}`)
  : null;

export function chainName(id: number | null | undefined) {
  if (id == null) return "No network";
  if (id === BOT_MAINNET.id) return BOT_MAINNET.name;
  if (id === BOT_TESTNET.id) return BOT_TESTNET.name;
  return `Chain ${id}`;
}

export function txUrl(hash: string, chain: ChainConfig = TARGET_CHAIN) {
  return `${chain.explorer}/tx/${hash}`;
}
export function addressUrl(address: string, chain: ChainConfig = TARGET_CHAIN) {
  return `${chain.explorer}/address/${address}`;
}
