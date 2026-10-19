// Markdown and JSON exports. Both carry the schema, the provider state and every timestamp.

import { PROVIDER_DEFS, isEnabled, providerLabel } from "./providers";
import {
  KIND_LABEL,
  SCHEMA_ID,
  STATUS_LABEL,
  horizonOf,
  lensOf,
  networkOf,
  type Brief,
} from "./schema";
import { autoLimitations, autoUnknowns, checkRules, evaluateEvidence, missingMetrics, sourceMode } from "./evaluate";

export function briefToJSON(brief: Brief, includePrivateNotes = false) {
  const { privateNotes, ...rest } = brief;
  return {
    schema: SCHEMA_ID,
    exportedAt: new Date().toISOString(),
    generatedFrom: sourceMode(brief),
    record: brief.receipt ? "committed" : "local-only",
    providers: PROVIDER_DEFS.map((p) => ({ id: p.id, label: p.label, enabled: p.adapter && isEnabled(p.id) })),
    providersUsed: [...new Set(brief.evidence.map((e) => e.providerId))].map((id) => ({ id, label: providerLabel(id) })),
    brief: includePrivateNotes ? { ...rest, privateNotes } : rest,
    derived: {
      evidence: evaluateEvidence(brief).map((e) => ({ id: e.id, effectiveStatus: e.effective, age: e.age ?? null, conflict: e.conflictWith ?? null })),
      unavailable: missingMetrics(brief),
      rules: checkRules(brief).map((r) => ({ id: r.rule.id, evaluable: r.evaluable, missing: r.missing })),
      unknowns: autoUnknowns(brief),
      limitations: autoLimitations(brief),
    },
  };
}

const esc = (s: string) => s.replace(/([\\`*_[\]#|<>])/g, "\\$1");

export function briefToMarkdown(brief: Brief): string {
  const ev = evaluateEvidence(brief);
  const net = networkOf(brief.asset.network);
  const L: string[] = [];
  L.push(`# ${esc(brief.question || "Untitled brief")}`, "");
  L.push(`Schema \`${SCHEMA_ID}\` · ${brief.receipt ? "Receipt committed" : "Local only"} · saved ${brief.updatedAt}`, "");
  L.push("## Asset", `${esc(brief.asset.query || "Not set")} · ${net.label}${net.chainId ? ` (chain ${net.chainId})` : ""}${brief.asset.contract ? ` · \`${brief.asset.contract}\`` : ""}`, "");
  L.push("## Horizon and lens", `${horizonOf(brief.horizon).label} · ${lensOf(brief.lens).label}`, "");
  L.push("## Evidence", "| Metric | Value | Kind | Source | Observed | Status |", "| --- | ---: | --- | --- | --- | --- |");
  for (const e of ev) {
    const src = e.sourceUrl ? `[${esc(e.sourceLabel || e.sourceUrl)}](${e.sourceUrl})` : esc(e.sourceLabel || "—");
    const status = STATUS_LABEL[e.effective] + (e.conflictWith ? ` (${e.conflictWith})` : e.effective === "stale" && e.age ? ` (${e.age})` : "");
    L.push(`| ${esc(e.metricName)} | ${esc(`${e.value} ${e.unit}`.trim())} | ${KIND_LABEL[e.kind]} | ${src} | ${e.sourceTimestamp || e.collectedAt} | ${status} |`);
  }
  for (const m of missingMetrics(brief)) L.push(`| ${esc(m.metric)} | — | Source data | — | — | Unavailable (${m.reason}) |`);
  L.push("");
  L.push("## Risks", esc(brief.risks || "None written."), "");
  L.push("## Invalidation");
  const rules = checkRules(brief);
  if (!rules.length) L.push("No rules written.");
  for (const r of rules) {
    L.push(`- ${esc(r.rule.text)} (${r.rule.type === "threshold" ? "measured threshold" : "qualitative"}; ${r.evaluable ? "data present" : `cannot evaluate: needs ${r.missing.join(", ")}`})`);
  }
  L.push("", "## Unknowns");
  for (const u of autoUnknowns(brief, ev)) L.push(`- ${esc(u)}`);
  if (brief.unknowns.trim()) L.push(`- ${esc(brief.unknowns.trim())}`);
  L.push("", "## Limitations");
  for (const l of autoLimitations(brief)) L.push(`- ${l}`);
  if (brief.limitations.trim()) L.push(`- ${esc(brief.limitations.trim())}`);
  if (brief.receipt) {
    const r = brief.receipt;
    L.push("", "## Receipt", `Receipt ${r.receiptId} · digest \`${r.digest}\` · owner \`${r.owner}\` · chain ${r.chainId} · block ${r.blockNumber} · tx \`${r.txHash}\``);
  }
  L.push("", "_A research brief, not financial advice. A receipt proves a digest was recorded, not that the brief is true._");
  return L.join("\n");
}

export function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slug(brief: Brief) {
  return (
    (brief.question || "brief")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "brief"
  );
}
