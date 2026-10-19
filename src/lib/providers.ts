// Provider configuration. A provider is live only when its adapter exists, its API, terms and limits
// have been checked, and it is enabled. The switch is NEXT_PUBLIC_LOXEN_PROVIDERS (a comma list; the
// default enables both public BOT Chain sources). It holds no secrets: neither provider needs a key.

import type { Lens } from "./schema";

export type ProviderDef = {
  id: string;
  label: string;
  covers: string;
  adapter: boolean; // an adapter exists in src/server/providers
  note: string;
};

export const PROVIDER_DEFS: ProviderDef[] = [
  {
    id: "botscan",
    label: "BOTScan",
    covers: "Contract verification, holders, transfers, total supply",
    adapter: true,
    note: "Public Blockscout API, no key. Price fields are not used.",
  },
  {
    id: "botchain-rpc",
    label: "BOT Chain RPC",
    covers: "Contract code, name, symbol, total supply at a block",
    adapter: true,
    note: "Public JSON-RPC endpoint, read only.",
  },
  {
    id: "dex-pools",
    label: "DEX pool reader",
    covers: "Pool liquidity, volume",
    adapter: false,
    note: "Planned: venue not yet verified",
  },
];

const DEFAULT_ENABLED = "botscan,botchain-rpc";

export function enabledProviderIds(): string[] {
  const raw = process.env.NEXT_PUBLIC_LOXEN_PROVIDERS ?? DEFAULT_ENABLED;
  const wanted = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return PROVIDER_DEFS.filter((p) => p.adapter && wanted.includes(p.id)).map((p) => p.id);
}

export function isEnabled(id: string) {
  return enabledProviderIds().includes(id);
}

export function providerLabel(id: string) {
  return id === "user" ? "You" : PROVIDER_DEFS.find((p) => p.id === id)?.label ?? id;
}

export type CoverageState = "live" | "manual" | "calculated" | "available" | "conditional" | "planned" | "off";

const STATE_LABEL: Record<CoverageState, string> = {
  live: "Live",
  manual: "Manual entry",
  calculated: "Calculated from your entries",
  available: "Available",
  conditional: "Available when its data is present",
  planned: "Planned",
  off: "Off",
};

type CoverageSpec = { metric: string; liveFrom?: string[]; otherwise: CoverageState };
export type CoverageRow = { metric: string; state: CoverageState; label: string };

const SPEC: { lens: Lens; title: string; rows: CoverageSpec[] }[] = [
  {
    lens: "structure",
    title: "Market structure",
    rows: [
      { metric: "Spot price", otherwise: "manual" },
      { metric: "Price range over the horizon", otherwise: "manual" },
      { metric: "Order book depth", otherwise: "planned" },
    ],
  },
  {
    lens: "liquidity",
    title: "Liquidity",
    rows: [
      { metric: "Pool liquidity", otherwise: "manual" },
      { metric: "24-hour volume", otherwise: "manual" },
      { metric: "Slippage at your size", otherwise: "calculated" },
    ],
  },
  {
    lens: "onchain",
    title: "On-chain activity",
    rows: [
      { metric: "Contract verification", liveFrom: ["botscan"], otherwise: "manual" },
      { metric: "Holder count", liveFrom: ["botscan"], otherwise: "manual" },
      { metric: "Total supply", liveFrom: ["botchain-rpc", "botscan"], otherwise: "manual" },
      { metric: "Total transfers, all time", liveFrom: ["botscan"], otherwise: "manual" },
      { metric: "Transfers in the horizon", otherwise: "manual" },
      { metric: "Large transfers", otherwise: "planned" },
    ],
  },
  {
    lens: "risk",
    title: "Risk and invalidation",
    rows: [
      { metric: "Rule templates per lens", otherwise: "available" },
      { metric: "Rule evaluation", otherwise: "conditional" },
      { metric: "Model summary", otherwise: "off" },
    ],
  },
];

/** Enabled providers that can supply this metric live. */
export function liveProvidersFor(metric: string): string[] {
  const m = metric.trim().toLowerCase();
  for (const g of SPEC) for (const r of g.rows) if (r.metric.toLowerCase() === m) return (r.liveFrom ?? []).filter(isEnabled);
  return [];
}

/** Coverage computed from the enabled providers, so it can never claim a live source that is off. */
export function coverage(): { lens: Lens; title: string; rows: CoverageRow[] }[] {
  return SPEC.map((g) => ({
    ...g,
    rows: g.rows.map((r) => {
      const live = (r.liveFrom ?? []).filter(isEnabled);
      return live.length
        ? { metric: r.metric, state: "live" as const, label: `Live · ${live.map(providerLabel).join(" and ")}` }
        : { metric: r.metric, state: r.otherwise, label: STATE_LABEL[r.otherwise] };
    }),
  }));
}
