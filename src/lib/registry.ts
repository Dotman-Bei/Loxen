// Expected interface of ResearchReceiptRegistry (PRD §11). Keep in step with the contract when it lands.
// The frontend writes only: the digest and the schema version. Owner and time come from the chain.

import {
  BaseError,
  UserRejectedRequestError,
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
  "error EmptyDigest()",
  "error UnsupportedSchema(uint16 schemaVersion)",
  "error DuplicateDigest(uint256 existingReceiptId)",
  "error ReceiptNotFound(uint256 receiptId)",
  "error EnforcedPause()",
]);

/** True when the wallet refused, however deeply viem has wrapped the 4001 error. */
function isUserRejection(e: unknown): boolean {
  if (e instanceof BaseError) {
    return !!e.walk((x) => (x as { code?: number }).code === 4001 || x instanceof UserRejectedRequestError);
  }
  return (e as { code?: number }).code === 4001;
}

/** Plain words for the registry's own errors, as decoded from a failed simulation. */
function explainRevert(e: unknown): string {
  const text = `${(e as { shortMessage?: string }).shortMessage ?? ""} ${(e as { message?: string }).message ?? ""}`;
  if (/DuplicateDigest/.test(text)) return "Your wallet has already recorded this exact digest. Pick a new salt to record a new version.";
  if (/EnforcedPause/.test(text)) return "The registry is paused for maintenance. Reads still work; try again later.";
  if (/EmptyDigest/.test(text)) return "The digest was empty, so nothing was sent.";
  if (/UnsupportedSchema/.test(text)) return "This schema version is not accepted by the registry.";
  if (/insufficient funds/i.test(text)) return "Your wallet does not hold enough BOT to pay the network gas.";
  return (e as { shortMessage?: string }).shortMessage ?? "The registry rejected this call in simulation.";
}

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
    if (isUserRejection(e)) return { kind: "rejected" };
    return { kind: "reverted", reason: explainRevert(e) };
  }
}

// ---------- Reads (bounded; never synthesised) ----------

export type ReceiptRow = {
  receiptId: string;
  owner: `0x${string}`;
  digest: `0x${string}`;
  schemaVersion: number;
  timestamp: number; // unix seconds
  blockNumber: bigint | null;
  txHash: Hash | null;
};

export type ReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not-configured" | "rpc"; message: string };

const LOOKBACK_BLOCKS = BigInt(50_000);
const RECEIPT_EVENT = REGISTRY_ABI.find((x) => x.type === "event" && x.name === "ReceiptRegistered")!;

function rpcFailure(e: unknown): ReadResult<never> {
  const msg = (e as { shortMessage?: string }).shortMessage ?? "";
  return {
    ok: false,
    reason: "rpc",
    message: /timed? ?out/i.test(msg) ? "The RPC did not answer after 8 s." : "The RPC returned an error.",
  };
}

const notConfigured: ReadResult<never> = {
  ok: false,
  reason: "not-configured",
  message: "The registry address is not set for this deployment, so no events can be read.",
};

async function logs(owner?: `0x${string}`): Promise<ReceiptRow[]> {
  const latest = await publicClient.getBlockNumber();
  const fromBlock = latest > LOOKBACK_BLOCKS ? latest - LOOKBACK_BLOCKS : BigInt(0);
  const found = await publicClient.getLogs({
    address: REGISTRY_ADDRESS!,
    event: RECEIPT_EVENT as Extract<(typeof REGISTRY_ABI)[number], { type: "event" }>,
    args: owner ? { owner } : undefined,
    fromBlock,
    toBlock: latest,
  });
  return found
    .map((l) => {
      const a = (l as unknown as { args: { receiptId: bigint; owner: `0x${string}`; digest: `0x${string}`; schemaVersion: number; timestamp: bigint } }).args;
      return {
        receiptId: a.receiptId.toString(),
        owner: a.owner,
        digest: a.digest,
        schemaVersion: Number(a.schemaVersion),
        timestamp: Number(a.timestamp),
        blockNumber: l.blockNumber,
        txHash: l.transactionHash,
      };
    })
    .reverse();
}

export async function recentReceipts(limit = 20): Promise<ReadResult<ReceiptRow[]>> {
  if (!REGISTRY_ADDRESS) return notConfigured;
  try {
    return { ok: true, data: (await logs()).slice(0, limit) };
  } catch (e) {
    return rpcFailure(e);
  }
}

export async function receiptsByOwner(owner: `0x${string}`): Promise<ReadResult<{ count: number; rows: ReceiptRow[] }>> {
  if (!REGISTRY_ADDRESS) return notConfigured;
  try {
    const [count, rows] = await Promise.all([
      publicClient.readContract({ address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: "receiptCount", args: [owner] }),
      logs(owner),
    ]);
    return { ok: true, data: { count: Number(count), rows } };
  } catch (e) {
    return rpcFailure(e);
  }
}

export async function receiptById(id: bigint): Promise<ReadResult<ReceiptRow | null>> {
  if (!REGISTRY_ADDRESS) return notConfigured;
  try {
    const [owner, digest, schemaVersion, timestamp] = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "getReceipt",
      args: [id],
    });
    if (/^0x0{40}$/i.test(owner)) return { ok: true, data: null };
    return {
      ok: true,
      data: { receiptId: id.toString(), owner, digest, schemaVersion: Number(schemaVersion), timestamp: Number(timestamp), blockNumber: null, txHash: null },
    };
  } catch (e) {
    const msg = (e as { shortMessage?: string }).shortMessage ?? "";
    if (/ReceiptNotFound|revert/i.test(msg)) return { ok: true, data: null };
    return rpcFailure(e);
  }
}
