"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { StatusMark } from "@/components/StatusMark";
import { autoLimitations, autoUnknowns, checkRules, missingMetrics, summary } from "@/lib/evaluate";
import { briefToJSON, briefToMarkdown, download, slug } from "@/lib/export";
import { KIND_LABEL, SCHEMA_ID, horizonOf, lensOf, networkOf, type Brief } from "@/lib/schema";
import { deleteBrief, getBrief } from "@/lib/storage";
import { addressUrl, chainName, txUrl, BOT_MAINNET, BOT_TESTNET } from "@/lib/chains";
import { shortHex } from "@/lib/digest";
import { CopyButton } from "./CopyButton";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function BriefDetail({ id }: { id: string }) {
  const router = useRouter();
  const [brief, setBrief] = useState<Brief | null | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => setBrief(getBrief(id)), [id]);

  if (brief === undefined) return <DetailLoading />;
  if (brief === null) {
    return (
      <>
        <p className="crumbs">
          <Link href="/profile">Briefs on this device</Link> / <span>{id}</span>
        </p>
        <div className="title-row">
          <div>
            <h1>Brief not found</h1>
            <p className="title-sub">
              No brief with this ID is saved on this device. Briefs are stored in this browser only; open the device you
              saved it on, or start a new one.
            </p>
          </div>
          <div className="title-actions">
            <Link className="b b-primary" href="/workbench">New brief</Link>
          </div>
        </div>
      </>
    );
  }

  const s = summary(brief);
  const net = networkOf(brief.asset.network);
  const rules = checkRules(brief);
  const missing = missingMetrics(brief);
  const context = s.evaluated.filter((e) => e.kind === "calculation" || e.kind === "interpretation");
  const r = brief.receipt;
  const chain = r?.chainId === BOT_MAINNET.id ? BOT_MAINNET : BOT_TESTNET;

  return (
    <>
      <p className="crumbs">
        <Link href="/profile">Briefs on this device</Link> / <span>{brief.id}</span>
      </p>
      <div className="title-row">
        <div>
          <h1>{brief.question || "Untitled brief"}</h1>
          <p className="title-sub">
            {brief.asset.contract ? shortHex(brief.asset.contract) : brief.asset.query || "No asset"} · {net.label}
            {net.chainId ? ` · ${net.chainId}` : ""} · {horizonOf(brief.horizon).label} · {lensOf(brief.lens).label} · saved{" "}
            {fmt(brief.updatedAt)}
          </p>
          <p className="title-sub">
            <strong>{s.filledCount} of 12 parts filled</strong> · {s.unavailable} unavailable · {s.stale} stale · {s.conflicting} conflicting ·{" "}
            {s.cannot} {s.cannot === 1 ? "rule" : "rules"} cannot be evaluated
          </p>
        </div>
        <div className="title-actions">
          {r ? (
            <span className="pill pill-pos">Receipt confirmed at block {r.blockNumber.toLocaleString("en-GB")}</span>
          ) : (
            <span className="pill">Only on this device</span>
          )}
          <Link className="b" href={`/workbench?brief=${brief.id}`}>Edit</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="card" aria-labelledby="h-trail">
            <div className="card-head">
              <h2 id="h-trail">Evidence trail</h2>
              <span className="meta">
                {s.evaluated.length} {s.evaluated.length === 1 ? "value" : "values"} · stale after {horizonOf(brief.horizon).staleLabel}
              </span>
            </div>
            {s.evaluated.length === 0 && missing.length === 0 ? (
              <p className="empty">This brief has no evidence. Edit it to add values with their sources.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Metric and source</th>
                      <th className="num">Value</th>
                      <th>Kind</th>
                      <th className="num">Observed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.evaluated.map((e) => (
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
                          {fmt(e.sourceTimestamp || e.collectedAt)}
                          {e.age && <span className="sub">{e.age} now</span>}
                        </td>
                        <td className="m-line2">
                          <StatusMark status={e.effective} detail={e.conflictWith} />
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="detail-pair">
            <section className="card" aria-labelledby="h-context">
              <div className="card-head">
                <h2 id="h-context">Market context</h2>
                <span className="meta">Calculations and interpretation</span>
              </div>
              {context.length === 0 ? (
                <p className="empty">No calculations or interpretation in this brief. Source data stands on its own.</p>
              ) : (
                <ul className="pv-list">
                  {context.map((c) => (
                    <li key={c.id}>
                      <strong>{c.metricName}</strong> {c.value}
                      {c.unit ? ` ${c.unit}` : ""} <span className="note">· {KIND_LABEL[c.kind]} · {c.sourceLabel}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="card" aria-labelledby="h-risks">
              <div className="card-head">
                <h2 id="h-risks">Risks</h2>
              </div>
              {brief.risks.trim() ? <p>{brief.risks}</p> : <p className="empty">No risks written.</p>}
            </section>
          </div>

          <section className="card" aria-labelledby="h-inval">
            <div className="card-head">
              <h2 id="h-inval">Invalidation</h2>
              <span className="meta">
                {rules.length} {rules.length === 1 ? "rule" : "rules"} · {s.cannot} cannot be evaluated
              </span>
            </div>
            {rules.length === 0 ? (
              <p className="empty">No invalidation rules. A brief without them cannot say what would change its view.</p>
            ) : (
              <ul className="rules">
                {rules.map((c) => (
                  <li key={c.rule.id} className="rule rule-ro">
                    <span className="rule-text">{c.rule.text}</span>
                    {c.evaluable ? <span className="pill pill-pos">Data present</span> : <span className="pill">Cannot evaluate</span>}
                    <span className="rule-meta">
                      {c.rule.type === "threshold" ? "Measured threshold" : "Qualitative"}
                      {c.rule.requires.length ? ` · needs ${c.rule.requires.join(", ")}` : ""}
                      {!c.evaluable && ` · missing ${c.missing.join(", ")}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="detail-pair">
            <section className="card" aria-labelledby="h-unk">
              <div className="card-head">
                <h2 id="h-unk">Unknowns</h2>
              </div>
              <ul className="pv-list">
                {autoUnknowns(brief, s.evaluated).map((u) => (
                  <li key={u}>{u}</li>
                ))}
                {brief.unknowns.trim() && <li>{brief.unknowns}</li>}
              </ul>
              {autoUnknowns(brief, s.evaluated).length === 0 && !brief.unknowns.trim() && (
                <p className="empty">Nothing missing that Loxen can detect.</p>
              )}
            </section>
            <section className="card" aria-labelledby="h-lim">
              <div className="card-head">
                <h2 id="h-lim">Limitations</h2>
              </div>
              <ul className="pv-list">
                {autoLimitations().map((l) => (
                  <li key={l}>{l}</li>
                ))}
                {brief.limitations.trim() && <li>{brief.limitations}</li>}
              </ul>
            </section>
          </div>
        </div>

        <aside className="detail-rail" aria-label="Record">
          <section className="card" aria-labelledby="h-record">
            <div className="card-head">
              <h2 id="h-record">Record</h2>
              <span className="meta">{SCHEMA_ID}</span>
            </div>
            {r ? (
              <dl className="kv">
                <dt>Receipt</dt>
                <dd><code>{r.receiptId}</code></dd>
                <dt>Digest</dt>
                <dd>
                  <code>{shortHex(r.digest, 10, 6)}</code> <CopyButton value={r.digest} label="Copy digest" />
                </dd>
                <dt>Owner</dt>
                <dd>
                  <a href={addressUrl(r.owner, chain)} rel="noopener" target="_blank"><code>{shortHex(r.owner)}</code></a>
                </dd>
                <dt>Network</dt>
                <dd>{chainName(r.chainId)}</dd>
                <dt>Block</dt>
                <dd className="num">{r.blockNumber.toLocaleString("en-GB")}</dd>
                <dt>Time</dt>
                <dd>{fmt(r.blockTime)}</dd>
                <dt>Transaction</dt>
                <dd>
                  <a href={txUrl(r.txHash, chain)} rel="noopener" target="_blank">
                    <code>{shortHex(r.txHash)}</code> <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </dd>
              </dl>
            ) : (
              <>
                <p>
                  This brief is saved in this browser only. Nothing about it is on BOT Chain.
                </p>
                <Link className="b b-primary rail-action" href={`/registry?brief=${brief.id}`}>Prepare receipt</Link>
                <p className="note" style={{ marginTop: 8 }}>
                  Shows exactly what would be written before you sign anything.
                </p>
              </>
            )}
          </section>

          <section className="card" aria-labelledby="h-export">
            <div className="card-head">
              <h2 id="h-export">Export</h2>
            </div>
            <div className="export-row">
              <button className="b" onClick={() => download(`${slug(brief)}.md`, briefToMarkdown(brief), "text/markdown")}>Markdown</button>
              <button className="b" onClick={() => download(`${slug(brief)}.json`, JSON.stringify(briefToJSON(brief), null, 2), "application/json")}>
                JSON
              </button>
            </div>
            <p className="note" style={{ marginTop: 8 }}>
              Both carry the schema, provider state and every timestamp. Private notes are left out.
            </p>
          </section>

          <section className="card" aria-labelledby="h-del">
            <div className="card-head">
              <h2 id="h-del">Remove from this device</h2>
            </div>
            {confirming ? (
              <>
                <p>
                  Delete “{brief.question || brief.id}” from this browser? {r ? "The on-chain receipt stays on BOT Chain." : "This cannot be undone."}
                </p>
                <div className="export-row" style={{ marginTop: 12 }}>
                  <button
                    className="b b-danger"
                    onClick={() => {
                      deleteBrief(brief.id);
                      router.push("/profile");
                    }}
                  >
                    Delete brief
                  </button>
                  <button className="b b-text" onClick={() => setConfirming(false)}>Keep it</button>
                </div>
              </>
            ) : (
              <button className="b b-text b-danger-text" onClick={() => setConfirming(true)}>Delete this brief…</button>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

function DetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading brief">
      <p className="crumbs">Briefs on this device</p>
      <div className="skeleton" style={{ height: 30, width: "48%" }} />
      <div className="skeleton" style={{ height: 14, width: "36%", marginTop: 10 }} />
      <div className="detail-grid">
        <div className="detail-main">
          <div className="card" style={{ height: 320 }} />
        </div>
        <div className="detail-rail">
          <div className="card" style={{ height: 200 }} />
        </div>
      </div>
    </div>
  );
}
