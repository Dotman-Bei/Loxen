"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { StatusMark } from "@/components/StatusMark";
import {
  BRIEF_PARTS,
  HORIZONS,
  KIND_LABEL,
  LENSES,
  LENS_METRICS,
  NETWORKS,
  RULE_TEMPLATES,
  SCHEMA_ID,
  type Brief,
  type BriefPart,
  type ContentKind,
  type Horizon,
  type Lens,
  type Network,
  type RuleType,
} from "@/lib/schema";
import { autoLimitations, autoUnknowns, checkAsset, checkRules, missingMetrics, summary } from "@/lib/evaluate";
import { briefToJSON, briefToMarkdown, download, slug } from "@/lib/export";
import { getBrief, newId, saveBrief } from "@/lib/storage";
import { BriefPreview } from "./BriefPreview";
import { SourcesCard } from "./SourcesCard";

const PART_TARGET: Record<BriefPart, string> = {
  Question: "card-question",
  Asset: "card-asset",
  Horizon: "card-lens",
  Evidence: "card-evidence",
  Sources: "card-sources",
  Timestamps: "card-evidence",
  Status: "card-evidence",
  Context: "card-evidence",
  Risks: "card-risks",
  Invalidation: "card-risks",
  Unknowns: "card-unknowns",
  Limitations: "card-unknowns",
};

function blankBrief(question = "", horizon: Horizon = "weeks"): Brief {
  const now = new Date().toISOString();
  return {
    id: newId("b"),
    schema: SCHEMA_ID,
    question,
    asset: { query: "", network: "bohr", contract: "" },
    horizon,
    lens: "liquidity",
    evidence: [],
    rules: [],
    risks: "",
    unknowns: "",
    limitations: "",
    privateNotes: "",
    createdAt: now,
    updatedAt: now,
  };
}

function localNow() {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function Workbench() {
  const params = useSearchParams();
  const router = useRouter();
  const [brief, setBrief] = useState<Brief>(() => {
    const h = params.get("h");
    return blankBrief(params.get("q")?.slice(0, 280) ?? "", h === "days" || h === "weeks" || h === "intraday" || h === "long" ? h : "weeks");
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<"compose" | "brief">("compose");

  // open an existing brief
  useEffect(() => {
    const id = params.get("brief");
    if (!id) return;
    const found = getBrief(id);
    if (found) {
      setBrief(found);
      setSavedAt(found.updatedAt);
    }
  }, [params]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const update = (patch: Partial<Brief>) => {
    setBrief((b) => ({ ...b, ...patch }));
    setDirty(true);
  };

  const s = useMemo(() => summary(brief), [brief]);
  const asset = checkAsset(brief.asset.query);

  const save = () => {
    const next = { ...brief, updatedAt: new Date().toISOString() };
    const ok = saveBrief(next);
    if (!ok) {
      setToast("Couldn’t save: this browser is blocking storage. Export the brief instead.");
      return;
    }
    setBrief(next);
    setSavedAt(next.updatedAt);
    setDirty(false);
    setToast("Saved on this device");
    router.replace(`/workbench?brief=${next.id}`, { scroll: false });
  };

  const exportAs = (kind: "md" | "json") => {
    if (kind === "md") download(`${slug(brief)}.md`, briefToMarkdown(brief), "text/markdown");
    else download(`${slug(brief)}.json`, JSON.stringify(briefToJSON(brief), null, 2), "application/json");
  };

  const jump = (part: BriefPart) => {
    setTab("compose");
    requestAnimationFrame(() => document.getElementById(PART_TARGET[part])?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const finding = [
    `${s.filledCount} of 12 parts filled`,
    `${s.unavailable} ${s.unavailable === 1 ? "value" : "values"} unavailable`,
    s.stale ? `${s.stale} stale` : null,
    s.conflicting ? `${s.conflicting} conflicting` : null,
    `${s.cannot} ${s.cannot === 1 ? "rule" : "rules"} cannot be evaluated`,
  ].filter(Boolean);

  return (
    <>
      <div className="title-row">
        <div>
          <h1>{brief.question.trim() || "New brief"}</h1>
          <p className="title-sub">{finding.join(" · ")}</p>
        </div>
        <div className="title-actions">
          <span className="fresh">
            {savedAt ? (dirty ? `Unsaved changes · last saved ${fmtTime(savedAt)}` : `Saved on this device ${fmtTime(savedAt)}`) : "Not saved"}
          </span>
          {savedAt && !dirty && (
            <Link className="b" href={`/brief/${brief.id}`}>
              Open brief
            </Link>
          )}
          <ExportMenu onExport={exportAs} />
          <button
            className="b b-primary"
            onClick={save}
            disabled={!brief.question.trim()}
            title={brief.question.trim() ? undefined : "Write a question first"}
          >
            Save brief
          </button>
        </div>
      </div>

      <nav className="strip" aria-label="Parts of the brief">
        {BRIEF_PARTS.map((p) => (
          <button key={p} onClick={() => jump(p)} className={s.filled[p] ? "is-filled" : "is-empty"}>
            <span className="part-name">{p}</span>
            <span className="part-state">{s.filled[p] ? "Filled" : "—"}</span>
          </button>
        ))}
      </nav>

      <div className="mobile-tabs seg" role="tablist" aria-label="View">
        <button role="tab" aria-selected={tab === "compose"} onClick={() => setTab("compose")}>Compose</button>
        <button role="tab" aria-selected={tab === "brief"} onClick={() => setTab("brief")}>Brief</button>
      </div>

      <div className="wb-grid" data-tab={tab}>
        <div className="wb-compose">
          <section className="card" id="card-question" aria-labelledby="h-question">
            <div className="card-head">
              <h2 id="h-question">Question</h2>
              <span className="meta">{brief.question.length} / 280</span>
            </div>
            <div className="field">
              <label className="label" htmlFor="q">What are you trying to find out?</label>
              <textarea
                id="q"
                className="textarea"
                rows={2}
                maxLength={280}
                value={brief.question}
                placeholder="What would make this pool too thin for a two-week view?"
                onChange={(e) => update({ question: e.target.value })}
              />
              <p className="help">One question. You can change it later.</p>
            </div>
          </section>

          <section className="card" id="card-asset" aria-labelledby="h-asset">
            <div className="card-head">
              <h2 id="h-asset">Asset</h2>
            </div>
            <div className="row2">
              <div className="field">
                <label className="label" htmlFor="asset">Symbol, name or contract address</label>
                <input
                  id="asset"
                  className="input"
                  value={brief.asset.query}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="0x… or a symbol"
                  onChange={(e) => {
                    const query = e.target.value;
                    const c = checkAsset(query);
                    const contract = c.kind === "address" && c.ok ? c.checksummed : "";
                    const changed = contract.toLowerCase() !== brief.asset.contract.toLowerCase();
                    update({
                      asset: { ...brief.asset, query, contract, ...(changed ? { name: undefined, symbol: undefined } : {}) },
                      // provider values belong to the old asset: drop them when the asset changes
                      ...(changed ? { evidence: brief.evidence.filter((e) => e.providerId === "user"), providerErrors: [] } : {}),
                    });
                  }}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="net">Network</label>
                <select
                  id="net"
                  className="select"
                  value={brief.asset.network}
                  onChange={(e) => update({ asset: { ...brief.asset, network: e.target.value as Network } })}
                >
                  {NETWORKS.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                      {n.chainId ? ` · ${n.chainId}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p
              className={`help${asset.kind === "address" ? (asset.ok ? " is-ok" : " is-bad") : ""}`}
              style={{ marginTop: 8 }}
              aria-live="polite"
            >
              {asset.kind === "empty" && "A contract address is the only way to be sure which asset you mean."}
              {asset.kind === "symbol" &&
                "No provider can resolve symbols in this build. Enter the contract address to be sure which asset you mean."}
              {asset.kind === "address" && asset.ok && (
                <>
                  Valid address, checksum <code>{asset.checksummed.slice(0, 10)}…{asset.checksummed.slice(-6)}</code>
                </>
              )}
              {asset.kind === "address" && !asset.ok && asset.reason}
            </p>
          </section>

          <section className="card" id="card-lens" aria-labelledby="h-lens">
            <div className="card-head">
              <h2 id="h-lens">Horizon and lens</h2>
              <span className="meta">Stale after {HORIZONS.find((h) => h.id === brief.horizon)!.staleLabel}</span>
            </div>
            <p className="label">Time horizon</p>
            <div className="seg" role="group" aria-label="Time horizon">
              {HORIZONS.map((h) => (
                <button key={h.id} aria-pressed={brief.horizon === h.id} onClick={() => update({ horizon: h.id })}>
                  {h.label}
                </button>
              ))}
            </div>
            <p className="label" style={{ marginTop: 16 }}>Research lens</p>
            <div className="seg" role="group" aria-label="Research lens">
              {LENSES.map((l) => (
                <button key={l.id} aria-pressed={brief.lens === l.id} onClick={() => update({ lens: l.id as Lens })}>
                  {l.label}
                </button>
              ))}
            </div>
          </section>

          <SourcesCard brief={brief} update={update} />

          <EvidenceCard brief={brief} evaluated={s.evaluated} update={update} />

          <RulesCard brief={brief} update={update} />

          <section className="card" id="card-unknowns" aria-labelledby="h-unknowns">
            <div className="card-head">
              <h2 id="h-unknowns">Unknowns and limitations</h2>
            </div>
            <ul className="pv-list">
              {autoUnknowns(brief, s.evaluated).map((u) => (
                <li key={u}>{u}</li>
              ))}
              {autoUnknowns(brief, s.evaluated).length === 0 && <li>Nothing missing that Loxen can detect.</li>}
            </ul>
            <div className="field" style={{ marginTop: 16 }}>
              <label className="label" htmlFor="unknowns">Anything else you could not verify</label>
              <textarea id="unknowns" className="textarea" rows={2} value={brief.unknowns} onChange={(e) => update({ unknowns: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="limits">Limitations you want on record</label>
              <textarea id="limits" className="textarea" rows={2} value={brief.limitations} onChange={(e) => update({ limitations: e.target.value })} />
              <p className="help">Added automatically: {autoLimitations(brief)[0]}</p>
            </div>
            <div className="field">
              <label className="label" htmlFor="private">Private notes</label>
              <textarea id="private" className="textarea" rows={2} value={brief.privateNotes} onChange={(e) => update({ privateNotes: e.target.value })} />
              <p className="help">Left out of exports and receipts unless you opt in on the Registry screen.</p>
            </div>
          </section>
        </div>

        <aside className="wb-preview card" aria-label="Brief preview">
          <BriefPreview brief={brief} evaluated={s.evaluated} />
        </aside>
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}

function ExportMenu({ onExport }: { onExport: (k: "md" | "json") => void }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pick = (k: "md" | "json") => {
    onExport(k);
    ref.current?.removeAttribute("open");
  };
  return (
    <details className="menu" ref={ref}>
      <summary className="b">Export</summary>
      <div className="menu-pop" role="menu">
        <button role="menuitem" onClick={() => pick("md")}>Markdown (.md)</button>
        <button role="menuitem" onClick={() => pick("json")}>JSON (.json)</button>
      </div>
    </details>
  );
}

function EvidenceCard({
  brief,
  evaluated,
  update,
}: {
  brief: Brief;
  evaluated: ReturnType<typeof summary>["evaluated"];
  update: (p: Partial<Brief>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    metric: "",
    value: "",
    unit: "",
    kind: "source" as ContentKind,
    sourceLabel: "",
    sourceUrl: "",
    observed: "",
  });
  const missing = missingMetrics(brief);
  const allMetrics = Array.from(new Set(Object.values(LENS_METRICS).flat()));
  const canAdd = form.metric.trim() && form.value.trim() && (form.kind !== "source" || form.sourceLabel.trim());

  const add = () => {
    if (!canAdd) return;
    const observedIso = form.observed ? new Date(form.observed).toISOString() : new Date().toISOString();
    update({
      evidence: [
        ...brief.evidence,
        {
          id: newId("e"),
          metricName: form.metric.trim(),
          value: form.value.trim(),
          unit: form.unit.trim(),
          kind: form.kind,
          providerId: "user",
          sourceLabel: form.sourceLabel.trim(),
          sourceUrl: /^https?:\/\//.test(form.sourceUrl.trim()) ? form.sourceUrl.trim() : "",
          collectedAt: new Date().toISOString(),
          sourceTimestamp: observedIso,
          status: "user",
        },
      ],
    });
    setForm({ metric: "", value: "", unit: "", kind: "source", sourceLabel: "", sourceUrl: "", observed: localNow() });
  };

  return (
    <section className="card" id="card-evidence" aria-labelledby="h-evidence">
      <div className="card-head">
        <h2 id="h-evidence">Evidence</h2>
        <button
          className="b b-sm"
          onClick={() => {
            setOpen((o) => !o);
            setForm((f) => ({ ...f, observed: f.observed || localNow() }));
          }}
          aria-expanded={open}
        >
          <Plus size={14} aria-hidden="true" /> Add evidence
        </button>
      </div>

      {evaluated.length === 0 && missing.length === 0 ? (
        <p className="empty">No evidence yet. Add the first value with its source and the time you read it.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Metric</th>
                <th className="num">Value</th>
                <th>Kind</th>
                <th>Observed</th>
                <th>Status</th>
                <th className="row-x"><span className="visually-hidden">Remove</span></th>
              </tr>
            </thead>
            <tbody>
              {evaluated.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className="ident">{e.metricName}</span>
                    <span className="sub">
                      {e.sourceUrl ? (
                        <a href={e.sourceUrl} rel="noopener noreferrer" target="_blank">{e.sourceLabel || e.sourceUrl}</a>
                      ) : (
                        e.sourceLabel || "No source named"
                      )}
                    </span>
                  </td>
                  <td className="num">
                    {e.value}
                    {e.unit && <span className="dash"> {e.unit}</span>}
                  </td>
                  <td className="kind m-line2">{KIND_LABEL[e.kind]}</td>
                  <td className="num m-line2">
                    {fmtTime(e.sourceTimestamp || e.collectedAt)}
                    {e.age && <span className="sub">{e.age}</span>}
                  </td>
                  <td className="m-line2">
                    <StatusMark status={e.effective} detail={e.conflictWith} />
                  </td>
                  <td className="row-x">
                    <button
                      className="x-btn"
                      aria-label={`Remove ${e.metricName}`}
                      onClick={() => update({ evidence: brief.evidence.filter((x) => x.id !== e.id) })}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              {missing.map((m) => (
                <tr key={m.metric} className="is-missing">
                  <td>
                    <span className="ident">{m.metric}</span>
                    <span className="sub">{m.reason}</span>
                  </td>
                  <td className="num"><span className="dash">—</span></td>
                  <td className="kind m-line2">Source data</td>
                  <td className="num m-line2"><span className="dash">—</span></td>
                  <td className="m-line2"><StatusMark status="unavailable" /></td>
                  <td className="row-x m-hide" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <form
          className="add-form"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <div className="field span3">
            <label className="label" htmlFor="ev-metric">Metric</label>
            <input id="ev-metric" className="input" list="metric-list" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} />
            <datalist id="metric-list">
              {allMetrics.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <div className="field span2">
            <label className="label" htmlFor="ev-value">Value</label>
            <input id="ev-value" className="input" inputMode="decimal" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          <div className="field">
            <label className="label" htmlFor="ev-unit">Unit</label>
            <input id="ev-unit" className="input" placeholder="USD" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="field span2">
            <label className="label" htmlFor="ev-kind">Kind</label>
            <select id="ev-kind" className="select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ContentKind })}>
              {(Object.keys(KIND_LABEL) as ContentKind[]).map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>
          </div>
          <div className="field span2">
            <label className="label" htmlFor="ev-src">Source</label>
            <input id="ev-src" className="input" placeholder="BOTScan token page" value={form.sourceLabel} onChange={(e) => setForm({ ...form, sourceLabel: e.target.value })} />
          </div>
          <div className="field span2">
            <label className="label" htmlFor="ev-time">Observed at</label>
            <input id="ev-time" type="datetime-local" className="input" value={form.observed} onChange={(e) => setForm({ ...form, observed: e.target.value })} />
          </div>
          <div className="field span6">
            <label className="label" htmlFor="ev-url">Source link (optional)</label>
            <input id="ev-url" className="input" inputMode="url" placeholder="https://" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} />
          </div>
          <div className="form-actions span6">
            <button type="submit" className="b" disabled={!canAdd}>Add to brief</button>
            <button type="button" className="b b-text" onClick={() => setOpen(false)}>Cancel</button>
            <span className="note">
              {form.kind === "source" && !form.sourceLabel.trim() ? "Source data needs a source." : "Marked User supplied, with the time you give."}
            </span>
          </div>
        </form>
      )}
    </section>
  );
}

function RulesCard({ brief, update }: { brief: Brief; update: (p: Partial<Brief>) => void }) {
  const [text, setText] = useState("");
  const [type, setType] = useState<RuleType>("threshold");
  const [needs, setNeeds] = useState("");
  const checks = checkRules(brief);
  const templates = RULE_TEMPLATES[brief.lens].filter((t) => !brief.rules.some((r) => r.text === t.text));

  const addRule = (t: { text: string; type: RuleType; requires: string[] }, fromTemplate: boolean) =>
    update({ rules: [...brief.rules, { id: newId("r"), ...t, fromTemplate }] });

  return (
    <section className="card" id="card-risks" aria-labelledby="h-risks">
      <div className="card-head">
        <h2 id="h-risks">Risks and invalidation</h2>
        <span className="meta">
          {checks.length} {checks.length === 1 ? "rule" : "rules"} · {checks.filter((c) => !c.evaluable).length} cannot be evaluated
        </span>
      </div>
      <div className="field">
        <label className="label" htmlFor="risks">Known conditions that may weaken the view</label>
        <textarea id="risks" className="textarea" rows={2} value={brief.risks} onChange={(e) => update({ risks: e.target.value })} />
      </div>

      <p className="label" style={{ marginTop: 20 }}>What would make this view less credible</p>
      {checks.length === 0 ? (
        <p className="empty" style={{ marginTop: 8 }}>No invalidation rules yet. Write one below or start from a template.</p>
      ) : (
        <ul className="rules" style={{ marginTop: 8 }}>
          {checks.map((c) => (
            <li key={c.rule.id} className="rule">
              <span className="rule-text">{c.rule.text}</span>
              {c.evaluable ? (
                <span className="pill pill-pos">Data present</span>
              ) : (
                <span className="pill">Cannot evaluate</span>
              )}
              <button className="x-btn" aria-label={`Remove rule: ${c.rule.text}`} onClick={() => update({ rules: brief.rules.filter((r) => r.id !== c.rule.id) })}>
                <X size={14} aria-hidden="true" />
              </button>
              <span className="rule-meta">
                {c.rule.type === "threshold" ? "Measured threshold" : "Qualitative"}
                {c.rule.requires.length ? ` · needs ${c.rule.requires.join(", ")}` : " · needs no data"}
                {!c.evaluable && ` · missing ${c.missing.join(", ")}`}
                {c.rule.fromTemplate && " · from a template"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form
        className="add-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          addRule({ text: text.trim(), type, requires: needs.split(",").map((x) => x.trim()).filter(Boolean) }, false);
          setText("");
          setNeeds("");
        }}
      >
        <div className="field span6">
          <label className="label" htmlFor="rule-text">New rule</label>
          <input id="rule-text" className="input" placeholder="Pool liquidity falls below twice my intended size" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="field span2">
          <label className="label" htmlFor="rule-type">Type</label>
          <select id="rule-type" className="select" value={type} onChange={(e) => setType(e.target.value as RuleType)}>
            <option value="threshold">Measured threshold</option>
            <option value="qualitative">Qualitative</option>
          </select>
        </div>
        <div className="field span3">
          <label className="label" htmlFor="rule-needs">Data it needs</label>
          <input id="rule-needs" className="input" list="metric-list-rules" placeholder="Pool liquidity" value={needs} onChange={(e) => setNeeds(e.target.value)} />
          <datalist id="metric-list-rules">
            {Array.from(new Set(Object.values(LENS_METRICS).flat())).map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
        <div className="field" style={{ alignSelf: "end" }}>
          <button type="submit" className="b" disabled={!text.trim()}>Add rule</button>
        </div>
      </form>

      {templates.length > 0 && (
        <>
          <p className="label" style={{ marginTop: 20 }}>Templates for {LENSES.find((l) => l.id === brief.lens)!.label.toLowerCase()}</p>
          <p className="help" style={{ marginTop: 4 }}>A prompt to consider, not a verified fact.</p>
          <ul className="templates">
            {templates.map((t) => (
              <li key={t.text} className="template">
                <p>
                  {t.text}
                  <span className="note"> · {t.type === "threshold" ? "measured threshold" : "qualitative"}</span>
                </p>
                <button className="b b-sm" onClick={() => addRule(t, true)}>Add</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
