// Expected interface of ResearchReceiptRegistry (PRD §11). Keep in step with the contract when it lands.
// The frontend writes only: the digest and the schema version. Owner and time come from the chain.

import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  defineChain,
  http,
  parseAbi,
  type Hash,
} from "viem";
import { REGISTRY_ADDRESS, TARGET_CHAIN } from "./chains";
import { SCHEMA_VERSION } from "./schema";

export const REGISTRY_ABI = parseAbi([
  "function registerReceipt(bytes32 digest, uint16 schemaVersion) returns (uint256 receiptId)",
  "function receiptCount(address owner) view returns (uint256)",
  "function receiptsOf(address owner, uint256 offset, uint256 limit) view returns (uint256[])",
  "function getReceipt(uint256 receiptId) view returns (address owner, bytes32 digest, uint16 schemaVersion, uint64 timestamp)",
  "event ReceiptRegistered(uint256 indexed receiptId, address indexed owner, bytes32 indexed digest, uint16 schemaVersion, uint64 timestamp)",
]);

export const chain = defineChain({
  id: TARGET_CHAIN.id,
  name: TARGET_CHAIN.name,
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: [TARGET_CHAIN.rpcUrl] } },
  blockExplorers: { default: { name: "BOTScan", url: TARGET_CHAIN.explorer } },
});

export const publicClient = createPublicClient({ chain, transport: http(TARGET_CHAIN.rpcUrl, { timeout: 8_000 }) });

export type TxState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "awaiting" }
  | { kind: "pending"; hash: Hash }
  | { kind: "confirmed"; hash: Hash; blockNumber: bigint; receiptId: bigint; timestamp: bigint }
  | { kind: "rejected" }
  | { kind: "reverted"; hash?: Hash; reason: string }
  | { kind: "timeout"; hash: Hash }
  | { kind: "error"; reason: string };

/** Simulate, ask for one signature, then wait for a confirmed receipt. Never reports success early. */
export async function commitDigest(
  account: `0x${string}`,
  digest: `0x${string}`,
  onState: (s: TxState) => void,
): Promise<TxState> {
  if (!REGISTRY_ADDRESS) return { kind: "error", reason: "The registry contract is not configured for this deployment." };
  const eth = window.ethereum;
  if (!eth) return { kind: "error", reason: "No wallet found in this browser." };
  const wallet = createWalletClient({ account, chain, transport: custom(eth) });
  try {
    onState({ kind: "checking" });
    const { request } = await publicClient.simulateContract({
      account,
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "registerReceipt",
      args: [digest, SCHEMA_VERSION],
    });
    onState({ kind: "awaiting" });
    const hash = await wallet.writeContract(request);
    onState({ kind: "pending", hash });
    const receipt = await publicClient
      .waitForTransactionReceipt({ hash, timeout: 120_000 })
      .catch(() => null);
    if (!receipt) return { kind: "timeout", hash };
    if (receipt.status !== "success") return { kind: "reverted", hash, reason: "The transaction reverted." };
    for (const log of receipt.logs) {
      try {
        const ev = decodeEventLog({ abi: REGISTRY_ABI, data: log.data, topics: log.topics });
        if (ev.eventName === "ReceiptRegistered") {
          return { kind: "confirmed", hash, blockNumber: receipt.blockNumber, receiptId: ev.args.receiptId, timestamp: ev.args.timestamp };
        }
      } catch {
        /* other contracts' logs */
      }
    }
    return { kind: "reverted", hash, reason: "Confirmed, but no receipt event was found. Check the transaction on BOTScan." };
  } catch (e) {
    const err = e as { code?: number; shortMessage?: string; name?: string };
    if (err.code === 4001 || err.name === "UserRejectedRequestError") return { kind: "rejected" };
    return { kind: "reverted", reason: err.shortMessage ?? "The registry rejected this call in simulation." };
  }
}
