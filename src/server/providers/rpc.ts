// BOT Chain RPC adapter. Reads the contract directly: whether code exists, ERC-20 name, symbol,
// decimals and total supply, all at one block, and that block's timestamp as the source timestamp.

import { decodeFunctionResult, encodeFunctionData, parseAbi, type Hex } from "viem";
import type { Evidence } from "@/lib/schema";
import { NETWORK_INFO, adapterError, formatUnits, recordId, type Adapter, type AdapterDeps } from "./types";

export const RPC_ID = "botchain-rpc";

const ERC20 = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
]);

type RpcReply = { id: number; result?: unknown; error?: { code: number; message: string } };

async function batch(rpc: string, calls: { method: string; params: unknown[] }[], deps: AdapterDeps): Promise<RpcReply[]> {
  const res = await deps.fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(calls.map((c, i) => ({ jsonrpc: "2.0", id: i, ...c }))),
    signal: AbortSignal.timeout(deps.timeoutMs),
  });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { name: "HttpError", status: res.status });
  const body = await res.json();
  if (!Array.isArray(body)) throw new SyntaxError("RPC batch reply was not an array");
  return (body as RpcReply[]).sort((a, b) => a.id - b.id);
}

function decode<T>(fn: "name" | "symbol" | "decimals" | "totalSupply", reply: RpcReply | undefined): T | undefined {
  if (!reply || reply.error || typeof reply.result !== "string" || reply.result === "0x") return undefined;
  try {
    return decodeFunctionResult({ abi: ERC20, functionName: fn, data: reply.result as Hex }) as T;
  } catch {
    return undefined;
  }
}

export const rpcAdapter: Adapter = async (address, network, deps) => {
  const { rpc, chainId, explorer } = NETWORK_INFO[network];
  try {
    const head = await batch(rpc, [{ method: "eth_getBlockByNumber", params: ["latest", false] }], deps);
    const block = head[0]?.result as { number?: string; timestamp?: string } | undefined;
    if (!block?.number || !block.timestamp) throw new SyntaxError("No latest block");
    const tag = block.number;
    const blockTime = new Date(parseInt(block.timestamp, 16) * 1000).toISOString();
    const call = (fn: "name" | "symbol" | "decimals" | "totalSupply") => ({
      method: "eth_call",
      params: [{ to: address, data: encodeFunctionData({ abi: ERC20, functionName: fn }) }, tag],
    });
    const replies = await batch(rpc, [{ method: "eth_getCode", params: [address, tag] }, call("name"), call("symbol"), call("decimals"), call("totalSupply")], deps);

    const code = replies[0]?.result;
    if (typeof code !== "string") throw new SyntaxError("No code reply");
    if (code === "0x") {
      return {
        providerId: RPC_ID,
        records: [],
        asset: { address, isContract: false },
        error: { code: "not-contract", message: `No contract code at this address on chain ${chainId}.` },
      };
    }

    const name = decode<string>("name", replies[1]);
    const symbol = decode<string>("symbol", replies[2]);
    const decimals = decode<number>("decimals", replies[3]);
    const supply = decode<bigint>("totalSupply", replies[4]);
    const at = deps.now().toISOString();
    const base = {
      providerId: RPC_ID,
      sourceLabel: `BOT Chain RPC, block ${parseInt(tag, 16).toLocaleString("en-GB")}`,
      sourceUrl: `${explorer}/block/${parseInt(tag, 16)}`,
      collectedAt: at,
      sourceTimestamp: blockTime,
      kind: "source" as const,
      assetId: address,
      chainId,
    };
    const records: Evidence[] = [
      {
        ...base,
        id: recordId(RPC_ID),
        metricName: "Total supply",
        value: supply !== undefined && decimals !== undefined ? formatUnits(supply, Number(decimals)) : "",
        unit: supply !== undefined && decimals !== undefined ? symbol ?? "" : "",
        status: supply !== undefined && decimals !== undefined ? "live" : "unavailable",
        errorCode: supply !== undefined && decimals !== undefined ? undefined : "The contract does not answer the ERC-20 totalSupply and decimals calls",
      },
    ];
    return {
      providerId: RPC_ID,
      records,
      asset: { address, isContract: true, name, symbol, decimals: decimals !== undefined ? Number(decimals) : undefined },
    };
  } catch (e) {
    if ((e as { name?: string }).name === "HttpError") {
      return { providerId: RPC_ID, records: [], error: { code: "http", message: `The RPC returned an error (${(e as { status?: number }).status}).` } };
    }
    return { providerId: RPC_ID, records: [], error: adapterError(e) };
  }
};
