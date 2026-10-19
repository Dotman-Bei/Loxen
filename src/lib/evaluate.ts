// Deterministic checks on a brief. No model, no network: everything here is derived from the
// brief's own entries, so the same brief always gives the same result.

import { getAddress } from "viem";
import {
  ADDRESS_RE,
  BRIEF_PARTS,
  CONFLICT_THRESHOLD,
  LENS_METRICS,
  horizonOf,
  type Brief,
  type BriefPart,
  type Evidence,
  type Rule,
  type SourceStatus,
} from "./schema";

export type AddressCheck =
  | { kind: "empty" }
  | { kind: "address"; ok: true; checksummed: string }
  | { kind: "address"; ok: false; reason: string }
  | { kind: "symbol" };

export function checkAsset(query: string): AddressCheck {
  const q = query.trim();
  if (!q) return { kind: "empty" };
  if (!q.startsWith("0x")) return { kind: "symbol" };
  if (!ADDRESS_RE.test(q)) {
    return { kind: "address", ok: false, reason: "This is not a valid address: 0x followed by 40 hexadecimal characters." };
  }
  try {
    const mixed = q !== q.toLowerCase() && q !== "0x" + q.slice(2).toUpperCase();
    const checksummed = getAddress(q);
    if (mixed && checksummed !== q) {
      return { kind: "address", ok: false, reason: "The checksum does not match. Copy the address again from its source." };
    }
    return { kind: "address", ok: true, checksummed };
  } catch {
    return { kind: "address", ok: false, reason: "This is not a valid address." };
  }
}

const QUANTITY_UNITS = /holder|transfer|count|volume|trades|tx/i;

function numeric(v: string): number | null {
  const n = Number(v.replace(/[,\s]/g, "").replace(/[^\d.+-eE]/g, ""));
  return v.trim() && Number.isFinite(n) ? n : null;
}

export type EvaluatedEvidence = Evidence & { effective: SourceStatus; age?: string; conflictWith?: string };

function ageLabel(ms: number) {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m} min old`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h old`;
  return `${Math.round(h / 24)} days old`;
}

/** Applies the stale threshold for the horizon and flags material disagreements. */
export function evaluateEvidence(brief: Brief, now = Date.now()): EvaluatedEvidence[] {
  const limit = horizonOf(brief.horizon).staleAfterMs;
  const rows: EvaluatedEvidence[] = brief.evidence.map((e) => {
    const observed = Date.parse(e.sourceTimestamp || e.collectedAt);
    const ms = Number.isFinite(observed) ? now - observed : 0;
    let effective: SourceStatus = e.status;
    if (e.status !== "unavailable" && e.kind === "source" && ms > limit) effective = "stale";
    return { ...e, effective, age: Number.isFinite(observed) ? ageLabel(Math.max(0, ms)) : undefined };
  });
  // conflicts: same metric, two numeric values further apart than the threshold
  const byMetric = new Map<string, EvaluatedEvidence[]>();
  for (const r of rows) {
    if (r.kind !== "source" || r.effective === "unavailable") continue;
    const k = r.metricName.trim().toLowerCase();
    byMetric.set(k, [...(byMetric.get(k) ?? []), r]);
  }
  for (const group of byMetric.values()) {
    if (group.length < 2) continue;
    const nums = group.map((g) => numeric(g.value)).filter((n): n is number => n !== null && n !== 0);
    if (nums.length < 2) continue;
    const lo = Math.min(...nums);
    const hi = Math.max(...nums);
    const threshold = QUANTITY_UNITS.test(group[0].metricName) ? CONFLICT_THRESHOLD.quantity : CONFLICT_THRESHOLD.price;
    if (hi / lo - 1 > threshold) {
      const pct = ((hi / lo - 1) * 100).toFixed(1);
      for (const g of group) {
        g.effective = "conflicting";
        g.conflictWith = `${group.length} sources ${pct}% apart`;
      }
    }
  }
  return rows;
}

export type MissingMetric = { metric: string; reason: string };

/** Metrics the lens expects that have no usable value. They stay in the brief as unavailable. */
export function missingMetrics(brief: Brief): MissingMetric[] {
  const have = new Set(
    brief.evidence.filter((e) => e.status !== "unavailable").map((e) => e.metricName.trim().toLowerCase()),
  );
  return LENS_METRICS[brief.lens]
    .filter((m) => !have.has(m.toLowerCase()))
    .map((m) => ({ metric: m, reason: "No provider configured in this build, and no value entered" }));
}

export type RuleCheck = { rule: Rule; evaluable: boolean; missing: string[] };

export function checkRules(brief: Brief): RuleCheck[] {
  const have = new Set(
    brief.evidence.filter((e) => e.status !== "unavailable").map((e) => e.metricName.trim().toLowerCase()),
  );
  return brief.rules.map((rule) => {
    const missing = rule.requires.filter((m) => !have.has(m.toLowerCase()));
    return { rule, evaluable: missing.length === 0, missing };
  });
}

export function autoUnknowns(brief: Brief, evaluated = evaluateEvidence(brief)): string[] {
  const out: string[] = [];
  for (const m of missingMetrics(brief)) out.push(`${m.metric}: unavailable. ${m.reason}.`);
  for (const e of evaluated) {
    if (e.effective === "stale") out.push(`${e.metricName}: stale, ${e.age ?? "age unknown"}.`);
    if (e.effective === "conflicting") out.push(`${e.metricName}: conflicting, ${e.conflictWith}.`);
  }
  for (const r of checkRules(brief)) {
    if (!r.evaluable) out.push(`Rule cannot be evaluated: “${r.rule.text}” needs ${r.missing.join(", ")}.`);
  }
  return [...new Set(out)];
}

export function autoLimitations(): string[] {
  return [
    "Generated from user-provided inputs and local template logic. No live sources were queried.",
    "No model-generated text is included.",
    "Values marked User supplied were entered by hand and are only as good as their stated source.",
  ];
}

export function partsFilled(brief: Brief): Record<BriefPart, boolean> {
  const ev = brief.evidence;
  const f: Record<BriefPart, boolean> = {
    Question: brief.question.trim().length > 0,
    Asset: brief.asset.query.trim().length > 0,
    Horizon: true,
    Evidence: ev.length > 0,
    Sources: ev.length > 0 && ev.every((e) => e.sourceLabel.trim().length > 0),
    Timestamps: ev.length > 0 && ev.every((e) => !!(e.sourceTimestamp || e.collectedAt)),
    Status: ev.length > 0,
    Context: ev.some((e) => e.kind === "calculation" || e.kind === "interpretation") || brief.lens === "risk",
    Risks: brief.risks.trim().length > 0,
    Invalidation: brief.rules.length > 0,
    Unknowns: brief.unknowns.trim().length > 0 || autoUnknowns(brief).length > 0,
    Limitations: true,
  };
  return f;
}

export function summary(brief: Brief) {
  const filled = partsFilled(brief);
  const evaluated = evaluateEvidence(brief);
  const unavailable = missingMetrics(brief).length + evaluated.filter((e) => e.effective === "unavailable").length;
  const cannot = checkRules(brief).filter((r) => !r.evaluable).length;
  return {
    filled,
    filledCount: BRIEF_PARTS.filter((p) => filled[p]).length,
    unavailable,
    stale: evaluated.filter((e) => e.effective === "stale").length,
    conflicting: evaluated.filter((e) => e.effective === "conflicting").length,
    cannot,
    evaluated,
  };
}
