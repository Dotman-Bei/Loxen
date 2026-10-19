// Provider configuration for this build. A provider is listed as live only after its API,
// terms, limits and attribution have been checked and its adapter is enabled server-side.
// Nothing here is a live feed until `state` is "live".

import type { Lens } from "./schema";

export type CoverageState = "live" | "manual" | "calculated" | "available" | "conditional" | "planned" | "off";

export const COVERAGE_LABEL: Record<CoverageState, string> = {
  live: "Live",
  manual: "Manual entry",
  calculated: "Calculated from your entries",
  available: "Available",
  conditional: "Available when its data is present",
  planned: "Planned",
  off: "Off",
};

export type CoverageRow = { metric: string; state: CoverageState; providerId?: string };

export const COVERAGE: { lens: Lens; title: string; rows: CoverageRow[] }[] = [
  {
    lens: "structure",
    title: "Market structure",
    rows: [
      { metric: "Spot price", state: "manual" },
      { metric: "Price range over the horizon", state: "manual" },
      { metric: "Order book depth", state: "planned" },
    ],
  },
  {
    lens: "liquidity",
    title: "Liquidity",
    rows: [
      { metric: "Pool liquidity", state: "manual" },
      { metric: "24-hour volume", state: "manual" },
      { metric: "Slippage at your size", state: "calculated" },
    ],
  },
  {
    lens: "onchain",
    title: "On-chain activity",
    rows: [
      { metric: "Holder count", state: "manual" },
      { metric: "Transfers in the horizon", state: "manual" },
      { metric: "Contract verification on BOTScan", state: "manual" },
      { metric: "Large transfers", state: "planned" },
    ],
  },
  {
    lens: "risk",
    title: "Risk and invalidation",
    rows: [
      { metric: "Rule templates per lens", state: "available" },
      { metric: "Rule evaluation", state: "conditional" },
      { metric: "Model summary", state: "off" },
    ],
  },
];

export type ProviderHealth = {
  id: string;
  label: string;
  covers: string;
  configured: boolean;
  lastGoodFetch: string | null;
  note: string;
};

/** Providers known to the adapter layer. None is configured in this build. */
export const PROVIDERS: ProviderHealth[] = [
  {
    id: "botscan",
    label: "BOTScan",
    covers: "Contract verification, holders, transfers",
    configured: false,
    lastGoodFetch: null,
    note: "Not configured in this build",
  },
  {
    id: "botchain-rpc",
    label: "BOT Chain RPC",
    covers: "Block reads, registry events",
    configured: false,
    lastGoodFetch: null,
    note: "Not configured in this build",
  },
  {
    id: "dex-pools",
    label: "DEX pool reader",
    covers: "Pool liquidity, volume",
    configured: false,
    lastGoodFetch: null,
    note: "Planned: venue not yet verified",
  },
];

export const LIVE_PROVIDER_COUNT = PROVIDERS.filter((p) => p.configured).length;
