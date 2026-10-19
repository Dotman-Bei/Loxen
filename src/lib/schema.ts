// Loxen brief schema, version loxen.brief/1.
// Keep this file the single source for statuses, kinds, horizons, lenses and thresholds.

export const SCHEMA_ID = "loxen.brief/1";
export const SCHEMA_VERSION = 1;

export type SourceStatus =
  | "live"
  | "cached"
  | "user"
  | "stale"
  | "conflicting"
  | "unavailable";

export const STATUS_LABEL: Record<SourceStatus, string> = {
  live: "Live",
  cached: "Cached",
  user: "User supplied",
  stale: "Stale",
  conflicting: "Conflicting",
  unavailable: "Unavailable",
};

export type ContentKind = "source" | "calculation" | "interpretation" | "assumption";

export const KIND_LABEL: Record<ContentKind, string> = {
  source: "Source data",
  calculation: "Calculation",
  interpretation: "Interpretation",
  assumption: "Assumption",
};

export type Horizon = "intraday" | "days" | "weeks" | "long";

export const HORIZONS: { id: Horizon; label: string; staleAfterMs: number; staleLabel: string }[] = [
  { id: "intraday", label: "Intraday", staleAfterMs: 15 * 60_000, staleLabel: "15 minutes" },
  { id: "days", label: "1–7 days", staleAfterMs: 6 * 3_600_000, staleLabel: "6 hours" },
  { id: "weeks", label: "1–4 weeks", staleAfterMs: 24 * 3_600_000, staleLabel: "24 hours" },
  { id: "long", label: "Longer-term", staleAfterMs: 7 * 86_400_000, staleLabel: "7 days" },
];

export type Lens = "structure" | "liquidity" | "onchain" | "risk";

export const LENSES: { id: Lens; label: string }[] = [
  { id: "structure", label: "Market structure" },
  { id: "liquidity", label: "Liquidity" },
  { id: "onchain", label: "On-chain activity" },
  { id: "risk", label: "Risk and invalidation" },
];

/** Two sources disagree "materially" past these relative differences. */
export const CONFLICT_THRESHOLD = { price: 0.02, quantity: 0.1 };

export type Network = "botchain" | "bohr" | "evm" | "none";

export const NETWORKS: { id: Network; label: string; chainId?: number }[] = [
  { id: "botchain", label: "BOT Chain mainnet", chainId: 677 },
  { id: "bohr", label: "BOT Chain testnet", chainId: 968 },
  { id: "evm", label: "Another EVM chain" },
  { id: "none", label: "Not on a chain" },
];

export type Evidence = {
  id: string;
  metricName: string;
  value: string;
  unit: string;
  kind: ContentKind;
  providerId: string; // "user" for manual entries
  sourceLabel: string;
  sourceUrl: string;
  collectedAt: string; // ISO
  sourceTimestamp: string; // ISO or ""
  status: SourceStatus;
  errorCode?: string;
};

export type RuleType = "threshold" | "qualitative";

export type Rule = {
  id: string;
  text: string;
  type: RuleType;
  requires: string[]; // metric names
  fromTemplate: boolean;
};

export type Brief = {
  id: string;
  schema: typeof SCHEMA_ID;
  question: string;
  asset: { query: string; network: Network; contract: string };
  horizon: Horizon;
  lens: Lens;
  evidence: Evidence[];
  rules: Rule[];
  risks: string;
  unknowns: string;
  limitations: string;
  privateNotes: string;
  createdAt: string;
  updatedAt: string;
  receipt?: Receipt;
};

export type Receipt = {
  receiptId: string;
  digest: string;
  owner: string;
  chainId: number;
  txHash: string;
  blockNumber: number;
  blockTime: string;
};

/** The twelve parts of a brief, in export order. */
export const BRIEF_PARTS = [
  "Question",
  "Asset",
  "Horizon",
  "Evidence",
  "Sources",
  "Timestamps",
  "Status",
  "Context",
  "Risks",
  "Invalidation",
  "Unknowns",
  "Limitations",
] as const;
export type BriefPart = (typeof BRIEF_PARTS)[number];

/** Metrics each lens expects, so an empty one shows as unavailable instead of disappearing. */
export const LENS_METRICS: Record<Lens, string[]> = {
  structure: ["Spot price", "Price range over the horizon", "Order book depth"],
  liquidity: ["Pool liquidity", "24-hour volume", "Slippage at your size"],
  onchain: ["Holder count", "Transfers in the horizon", "Contract verification"],
  risk: [],
};

export const RULE_TEMPLATES: Record<Lens, { text: string; type: RuleType; requires: string[] }[]> = {
  structure: [
    { text: "Price closes below the low of the range I am using", type: "threshold", requires: ["Price range over the horizon", "Spot price"] },
    { text: "The main venue stops quoting the pair", type: "qualitative", requires: ["Order book depth"] },
  ],
  liquidity: [
    { text: "Pool liquidity falls below twice my intended size", type: "threshold", requires: ["Pool liquidity"] },
    { text: "Slippage at my size rises above 2%", type: "threshold", requires: ["Slippage at your size"] },
    { text: "24-hour volume drops by half against the start of the horizon", type: "threshold", requires: ["24-hour volume"] },
  ],
  onchain: [
    { text: "Holder count falls during the horizon", type: "threshold", requires: ["Holder count"] },
    { text: "The contract is not verified on BOTScan", type: "qualitative", requires: ["Contract verification"] },
  ],
  risk: [
    { text: "A source I rely on becomes unavailable for longer than the stale threshold", type: "qualitative", requires: [] },
    { text: "Two sources disagree past the conflict threshold on a value my view depends on", type: "qualitative", requires: [] },
  ],
};

export function horizonOf(id: Horizon) {
  return HORIZONS.find((h) => h.id === id)!;
}
export function lensOf(id: Lens) {
  return LENSES.find((l) => l.id === id)!;
}
export function networkOf(id: Network) {
  return NETWORKS.find((n) => n.id === id)!;
}

export const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
