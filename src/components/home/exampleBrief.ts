// The example brief shown on the home page. Illustrative only, and labelled "Example" wherever it
// appears: every value is user supplied or calculated from user-supplied values, never a live feed.
import type { Lens, SourceStatus } from "@/lib/schema";

export type ExampleRow = {
  metric: string;
  value: string;
  status: SourceStatus | "calc";
  note: string;
};

export type ExampleRule = { text: string; verdict: "holds" | "past" | "cannot"; note: string };

export const EXAMPLE = {
  question: "What would make this pool too thin for a two-week view?",
  asset: "Example token",
  network: "BOT Chain mainnet · 677",
  contract: "0x7a3f…c2e1",
  horizon: "1–4 weeks",
};

// Pool liquidity 184,200 USD → 92,100 USD per side. 5,000 USD in against 92,100 ≈ 5.4% (Δ / reserve).
// Transfers: 412 against 455 → 455 / 412 − 1 = 10.4%, past the 10% conflict threshold for counts.
export const EXAMPLE_ROWS: Record<Exclude<Lens, "risk">, ExampleRow[]> = {
  structure: [
    { metric: "Spot price", value: "—", status: "unavailable", note: "No price provider configured" },
    { metric: "Range, last 28 days", value: "0.0412–0.0587 USD", status: "user", note: "Your notes, 19 Oct 13:40" },
    { metric: "Order book depth", value: "—", status: "unavailable", note: "Planned, not in this build" },
  ],
  liquidity: [
    { metric: "Pool liquidity", value: "184,200 USD", status: "user", note: "Pool page, 19 Oct 13:52" },
    { metric: "24-hour volume", value: "21,930 USD", status: "stale", note: "31 h old, limit 24 h" },
    { metric: "Slippage at 5,000 USD", value: "≈ 5.4%", status: "calc", note: "x·y=k against 92,100 USD reserve" },
  ],
  onchain: [
    { metric: "Holder count", value: "1,284", status: "user", note: "BOTScan token page, 13:58" },
    { metric: "Transfers, 7 days", value: "412 | 455", status: "conflicting", note: "Two sources 10.4% apart" },
    { metric: "Contract verification", value: "Verified", status: "user", note: "BOTScan, 13:58" },
  ],
};

export const EXAMPLE_RULES: ExampleRule[] = [
  { text: "Pool liquidity falls below 10,000 USD", verdict: "holds", note: "184,200 USD now" },
  { text: "Slippage at my size rises above 2%", verdict: "past", note: "≈ 5.4% now" },
  { text: "The main venue stops quoting the pair", verdict: "cannot", note: "Order book depth is unavailable" },
];

export const LENS_COPY: Record<Lens, string> = {
  structure:
    "Price range, order book depth and where the asset trades, each with the venue it came from and the minute it was read.",
  liquidity:
    "Pool depth, volume and what a trade of your size would move, kept apart from the slippage Loxen calculates from them.",
  onchain:
    "Holders, transfers and contract verification from BOT Chain, with the block or minute each figure was read at.",
  risk: "The conditions that would make your view less credible, each with the data it needs and a plain “cannot evaluate” when that data is missing.",
};
