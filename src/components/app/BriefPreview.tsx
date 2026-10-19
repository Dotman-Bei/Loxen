"use client";

import { useEffect, useState } from "react";
import { StatusMark } from "@/components/StatusMark";
import { digestOf, newSalt, committable } from "@/lib/digest";
import { autoLimitations, autoUnknowns, checkRules, missingMetrics, sourceMode, type EvaluatedEvidence } from "@/lib/evaluate";
import { KIND_LABEL, SCHEMA_ID, horizonOf, lensOf, networkOf, type Brief } from "@/lib/schema";
import { CopyButton } from "./CopyButton";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** The brief exactly as it will be exported, part by part. */
export function BriefPreview({ brief, evaluated }: { brief: Brief; evaluated: EvaluatedEvidence[] }) {
  const [salt, setSalt] = useState<string | null>(null);
  useEffect(() => setSalt(newSalt()), []);
  const net = networkOf(brief.asset.network);
  const rules = checkRules(brief);
  const missing = missingMetrics(brief);
  const digest = salt ? digestOf({ brief: committable(brief, false), salt }) : null;

  return (
    <>
      <div className="card-head">
        <h2>Brief preview</h2>
        <span className="meta">{SCHEMA_ID}</span>
      </div>
      <p className="preview-mode">{sourceMode(brief)}</p>

      <div className="pv-section">
        <h3>Question</h3>
        <p className="pv-q">{brief.question.trim() || <span className="dash">—</span>}</p>
      </div>
      <div className="pv-section">
        <h3>Asset, horizon and lens</h3>
        <p>
          {brief.asset.query.trim() || <span className="dash">No asset</span>} · {net.label}
          {net.chainId ? ` · ${net.chainId}` : ""}
        </p>
        {brief.asset.contract && (
          <p className="note">
            <code>{brief.asset.contract}</code>
          </p>
        )}
        <p className="note">
          {horizonOf(brief.horizon).label} · {lensOf(brief.lens).label}
        </p>
      </div>
      <div className="pv-section">
        <h3>Evidence, sources, timestamps and status</h3>
        {evaluated.length === 0 && missing.length === 0 && <p className="dash">—</p>}
        {evaluated.map((e) => (
          <div key={e.id} className="pv-ev">
            <span>{e.metricName}</span>
            <span className="num">
              {e.value}
              {e.unit ? ` ${e.unit}` : ""}
            </span>
            <span className="sub">
              <StatusMark status={e.effective} detail={e.conflictWith ?? (e.effective === "stale" ? e.age : undefined)} />
              <span>{KIND_LABEL[e.kind]}</span>
              <span>{e.sourceLabel || "No source"}</span>
              <span>{fmt(e.sourceTimestamp || e.collectedAt)}</span>
            </span>
          </div>
        ))}
        {missing.map((m) => (
          <div key={m.metric} className="pv-ev">
            <span>{m.metric}</span>
            <span className="dash">—</span>
            <span className="sub">
              <StatusMark status="unavailable" />
              <span>{m.reason}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="pv-section">
        <h3>Risks</h3>
        <p>{brief.risks.trim() || <span className="dash">—</span>}</p>
      </div>
      <div className="pv-section">
        <h3>Invalidation</h3>
        {rules.length === 0 ? (
          <p className="dash">—</p>
        ) : (
          <ul className="pv-list">
            {rules.map((r) => (
              <li key={r.rule.id}>
                {r.rule.text}{" "}
                <span className="note">{r.evaluable ? "· data present" : `· cannot evaluate, needs ${r.missing.join(", ")}`}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="pv-section">
        <h3>Unknowns</h3>
        <ul className="pv-list">
          {autoUnknowns(brief, evaluated).map((u) => (
            <li key={u}>{u}</li>
          ))}
          {brief.unknowns.trim() && <li>{brief.unknowns.trim()}</li>}
        </ul>
        {autoUnknowns(brief, evaluated).length === 0 && !brief.unknowns.trim() && <p className="dash">—</p>}
      </div>
      <div className="pv-section">
        <h3>Limitations</h3>
        <ul className="pv-list">
          {autoLimitations(brief).map((l) => (
            <li key={l}>{l}</li>
          ))}
          {brief.limitations.trim() && <li>{brief.limitations.trim()}</li>}
        </ul>
      </div>
      <div className="pv-section">
        <h3>Digest preview, with a throwaway salt</h3>
        {digest ? (
          <div className="digest-line">
            <code>
              {digest.slice(0, 12)}…{digest.slice(-8)}
            </code>
            <CopyButton value={digest} label="Copy digest" />
          </div>
        ) : (
          <p className="dash">—</p>
        )}
        <p className="note">A receipt uses a new salt and your wallet. Nothing is written until you commit on the Registry screen.</p>
      </div>
    </>
  );
}
