// BOTScan adapter (Blockscout API v2). Reads only documented, public fields: contract verification,
// token metadata, holder count and all-time transfer count. Price fields are ignored on purpose:
// their source and definition are not documented, so they cannot be labelled as a live price.

import type { Evidence } from "@/lib/schema";
import { NETWORK_INFO, adapterError, formatUnits, recordId, type Adapter, type AdapterDeps } from "./types";

export const BOTSCAN_ID = "botscan";

async function getJson(url: string, deps: AdapterDeps): Promise<{ status: number; body: unknown }> {
  const res = await deps.fetch(url, { signal: AbortSignal.timeout(deps.timeoutMs), headers: { accept: "application/json" } });
  if (res.status === 404) return { status: 404, body: null };
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { name: "HttpError", status: res.status });
  return { status: res.status, body: await res.json() };
}

const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined);

export const botscanAdapter: Adapter = async (address, network, deps) => {
  const { explorer, chainId } = NETWORK_INFO[network];
  const api = `${explorer}/api/v2`;
  const at = deps.now().toISOString();
  const base = {
    providerId: BOTSCAN_ID,
    sourceLabel: "BOTScan",
    collectedAt: at,
    sourceTimestamp: "",
    kind: "source" as const,
    assetId: address,
    chainId,
  };

  try {
    const addr = await getJson(`${api}/addresses/${address}`, deps);
    if (addr.status === 404 || !addr.body || typeof addr.body !== "object") {
      return { providerId: BOTSCAN_ID, records: [], error: { code: "not-found", message: "BOTScan has no record of this address." } };
    }
    const a = addr.body as Record<string, unknown>;
    if (a.is_contract !== true) {
      return {
        providerId: BOTSCAN_ID,
        records: [],
        asset: { address, isContract: false },
        error: { code: "not-contract", message: "This address is a wallet, not a contract." },
      };
    }

    const records: Evidence[] = [
      {
        ...base,
        id: recordId(BOTSCAN_ID),
        metricName: "Contract verification",
        value: a.is_verified === true ? "Verified" : "Not verified",
        unit: "",
        sourceUrl: `${explorer}/address/${address}?tab=contract`,
        status: "live",
      },
    ];

    const [token, counters] = await Promise.all([
      getJson(`${api}/tokens/${address}`, deps),
      getJson(`${api}/tokens/${address}/counters`, deps),
    ]);

    if (token.status === 404 || !token.body) {
      for (const metric of ["Holder count", "Total transfers"]) {
        records.push({
          ...base,
          id: recordId(BOTSCAN_ID),
          metricName: metric,
          value: "",
          unit: "",
          sourceUrl: `${explorer}/address/${address}`,
          status: "unavailable",
          errorCode: "Not a token contract on BOTScan",
        });
      }
      return { providerId: BOTSCAN_ID, records, asset: { address, isContract: true, name: str(a.name) } };
    }

    const t = token.body as Record<string, unknown>;
    const c = (counters.body ?? {}) as Record<string, unknown>;
    const decimals = Number(str(t.decimals) ?? NaN);
    const holders = str(c.token_holders_count) ?? str(t.holders);
    const transfers = str(c.transfers_count);
    const supply = str(t.total_supply);
    const tokenUrl = `${explorer}/token/${address}`;

    const num = (v: string | undefined) => (v && /^\d+$/.test(v) ? Number(v).toLocaleString("en-GB") : undefined);
    const push = (metricName: string, value: string | undefined, unit: string, reason: string) =>
      records.push({
        ...base,
        id: recordId(BOTSCAN_ID),
        metricName,
        value: value ?? "",
        unit: value ? unit : "",
        sourceUrl: tokenUrl,
        status: value ? "live" : "unavailable",
        errorCode: value ? undefined : reason,
      });

    push("Holder count", num(holders), "holders", "BOTScan did not report a holder count");
    push("Total transfers", num(transfers), "all time", "BOTScan did not report a transfer count");
    push(
      "Total supply",
      supply && /^\d+$/.test(supply) && Number.isFinite(decimals) ? formatUnits(BigInt(supply), decimals) : undefined,
      str(t.symbol) ?? "",
      "BOTScan did not report a total supply",
    );

    return {
      providerId: BOTSCAN_ID,
      records,
      asset: {
        address,
        isContract: true,
        name: str(t.name),
        symbol: str(t.symbol),
        decimals: Number.isFinite(decimals) ? decimals : undefined,
        standard: str(t.type),
      },
    };
  } catch (e) {
    if ((e as { name?: string }).name === "HttpError") {
      return { providerId: BOTSCAN_ID, records: [], error: { code: "http", message: `BOTScan returned an error (${(e as { status?: number }).status}).` } };
    }
    return { providerId: BOTSCAN_ID, records: [], error: adapterError(e) };
  }
};
