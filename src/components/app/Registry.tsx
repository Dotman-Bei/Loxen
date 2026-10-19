"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { REGISTRY_ADDRESS, TARGET_CHAIN, chainName, txUrl, addressUrl } from "@/lib/chains";
import { committable, digestOf, newSalt, shortHex } from "@/lib/digest";
import { download, slug } from "@/lib/export";
import { commitDigest, type TxState } from "@/lib/registry";
import { SCHEMA_ID, SCHEMA_VERSION, type Brief } from "@/lib/schema";
import { listBriefs, saveBrief } from "@/lib/storage";
import { useWallet } from "@/lib/wallet";
import { CopyButton } from "./CopyButton";

const STEPS: { kind: TxState["kind"]; label: string }[] = [
  { kind: "checking", label: "Checking the call against the registry" },
  { kind: "awaiting", label: "Waiting for your wallet" },
  { kind: "pending", label: "Submitted, waiting for confirmation" },
  { kind: "confirmed", label: "Confirmed" },
];

export function Registry() {
  const params = useSearchParams();
  const wallet = useWallet();
  const [briefs, setBriefs] = useState<Brief[] | null>(null);
  const [briefId, setBriefId] = useState<string>("");
  const [includeNotes, setIncludeNotes] = useState(false);
  const [salt, setSalt] = useState<`0x${string}` | null>(null);
  const [tx, setTx] = useState<TxState>({ kind: "idle" });

  useEffect(() => {
    const all = listBriefs();
    setBriefs(all);
    const wanted = params.get("brief");
    setBriefId(wanted && all.some((b) => b.id === wanted) ? wanted : all[0]?.id ?? "");
    setSalt(newSalt());
  }, [params]);

  const brief = briefs?.find((b) => b.id === briefId) ?? null;
  const onTarget = wallet.chainId === TARGET_CHAIN.id;
  const digest = useMemo(
    () =>
      brief && salt
        ? digestOf({ brief: committable(brief, includeNotes), salt, owner: wallet.account ?? undefined, chainId: TARGET_CHAIN.id })
        : null,
    [brief, salt, includeNotes, wallet.account],
  );

  const blocker = !brief
    ? "Choose a brief first."
    : brief.receipt
      ? "This brief already has a confirmed receipt. Edit it to make a new version."
      : !REGISTRY_ADDRESS
        ? "The registry contract is not configured for this deployment, so receipts cannot be committed yet."
        : wallet.available === false
          ? "No wallet found in this browser."
          : !wallet.account
            ? "Connect a wallet to commit."
            : !onTarget
              ? `Switch your wallet to ${TARGET_CHAIN.name} (${TARGET_CHAIN.id}).`
              : null;

  const busy = tx.kind === "checking" || tx.kind === "awaiting" || tx.kind === "pending";

  const commit = async () => {
    if (blocker || !digest || !wallet.account || !brief || !salt) return;
    const result = await commitDigest(wallet.account, digest, setTx);
    setTx(result);
    if (result.kind === "confirmed") {
      const updated: Brief = {
        ...brief,
        receipt: {
          receiptId: result.receiptId.toString(),
          digest,
          owner: wallet.account,
          chainId: TARGET_CHAIN.id,
          txHash: result.hash,
          blockNumber: Number(result.blockNumber),
          blockTime: new Date(Number(result.timestamp) * 1000).toISOString(),
        },
      };
      saveBrief(updated);
      setBriefs((list) => list?.map((b) => (b.id === updated.id ? updated : b)) ?? null);
      download(
        `${slug(brief)}-receipt.json`,
        JSON.stringify(
          { schema: SCHEMA_ID, schemaVersion: SCHEMA_VERSION, salt, includesPrivateNotes: includeNotes, brief: committable(brief, includeNotes), receipt: updated.receipt },
          null,
          2,
        ),
        "application/json",
      );
    }
  };

  const reached = (k: TxState["kind"]) => {
    const order = ["checking", "awaiting", "pending", "confirmed"];
    return order.indexOf(tx.kind) >= order.indexOf(k) && order.includes(tx.kind);
  };

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Research receipt</h1>
          <p className="title-sub">
            Records a digest of one brief against your wallet on {TARGET_CHAIN.name}. The brief itself is not published.
          </p>
        </div>
      </div>

      <div className="reg-grid">
        <div className="reg-main">
          <section className="card" aria-labelledby="h-choose">
            <div className="card-head">
              <h2 id="h-choose">Brief</h2>
              <span className="meta">{briefs ? `${briefs.length} on this device` : ""}</span>
            </div>
            {briefs === null ? (
              <div className="skeleton" style={{ height: 38 }} />
            ) : briefs.length === 0 ? (
              <p className="empty">
                No briefs are saved on this device. <Link href="/workbench">Write one in the workbench</Link> first.
              </p>
            ) : (
              <div className="field">
                <label className="label" htmlFor="brief-pick">Brief to record</label>
                <select id="brief-pick" className="select" value={briefId} onChange={(e) => { setBriefId(e.target.value); setTx({ kind: "idle" }); }}>
                  {briefs.map((b) => (
                    <option key={b.id} value={b.id}>
                      {(b.question || "Untitled brief").slice(0, 80)}
                      {b.receipt ? " (receipt confirmed)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="h-written">
            <div className="card-head">
              <h2 id="h-written">What is written</h2>
              <span className="meta">Everything on BOT Chain is public and permanent</span>
            </div>
            <table className="table written">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                  <th>Where it goes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="ident">Digest</td>
                  <td>{digest ? <span className="inline-copy"><code>{shortHex(digest, 10, 8)}</code><CopyButton value={digest} label="Copy digest" /></span> : <span className="dash">—</span>}</td>
                  <td><span className="pill pill-warn">Public</span></td>
                </tr>
                <tr>
                  <td className="ident">Schema version</td>
                  <td><code>{SCHEMA_ID}</code></td>
                  <td><span className="pill pill-warn">Public</span></td>
                </tr>
                <tr>
                  <td className="ident">Owner</td>
                  <td>{wallet.account ? <code>{shortHex(wallet.account)}</code> : <span className="dash">Your wallet, once connected</span>}</td>
                  <td><span className="pill pill-warn">Public</span></td>
                </tr>
                <tr>
                  <td className="ident">Block and time</td>
                  <td><span className="dash">Set by the chain</span></td>
                  <td><span className="pill pill-warn">Public</span></td>
                </tr>
                <tr>
                  <td className="ident">Brief text and evidence</td>
                  <td>{brief ? `${brief.evidence.length} values, ${brief.rules.length} rules` : <span className="dash">—</span>}</td>
                  <td><span className="pill">Stays with you</span></td>
                </tr>
                <tr>
                  <td className="ident">Private notes</td>
                  <td>{brief?.privateNotes.trim() ? (includeNotes ? "Included in the digest" : "Left out of the digest") : <span className="dash">None written</span>}</td>
                  <td><span className="pill">Stays with you</span></td>
                </tr>
                <tr>
                  <td className="ident">Salt</td>
                  <td>{salt ? <code>{shortHex(salt, 10, 6)}</code> : <span className="dash">—</span>}</td>
                  <td><span className="pill">Stays with you</span></td>
                </tr>
              </tbody>
            </table>
            <div className="reg-options">
              <label className="check">
                <input type="checkbox" checked={includeNotes} disabled={!brief?.privateNotes.trim()} onChange={(e) => setIncludeNotes(e.target.checked)} />
                <span>
                  Include my private notes in the digest
                  <span className="help"> They stay private; only the digest changes.</span>
                </span>
              </label>
              <button className="b b-sm" onClick={() => setSalt(newSalt())} disabled={busy}>New salt</button>
            </div>
            <p className="note" style={{ marginTop: 12 }}>
              A receipt proves your wallet recorded this digest at a block. It does not prove the brief is accurate, that
              its sources were honest, or who holds the wallet.
            </p>
          </section>
        </div>

        <div className="reg-side">
          <section className="card" aria-labelledby="h-wallet">
            <div className="card-head">
              <h2 id="h-wallet">Wallet and network</h2>
            </div>
            <dl className="kv">
              <dt>Wallet</dt>
              <dd>
                {wallet.available === null ? <span className="dash">Checking…</span> : wallet.available === false ? "No wallet found in this browser" : wallet.account ? <code>{shortHex(wallet.account)}</code> : "Not connected"}
              </dd>
              <dt>Network</dt>
              <dd>
                {wallet.chainId == null ? <span className="dash">—</span> : chainName(wallet.chainId)}
                {wallet.chainId != null && !onTarget && <span className="pill pill-warn">Wrong network</span>}
              </dd>
              <dt>Expected</dt>
              <dd>
                {TARGET_CHAIN.name} · {TARGET_CHAIN.id}
              </dd>
              <dt>Contract</dt>
              <dd>
                {REGISTRY_ADDRESS ? (
                  <a href={addressUrl(REGISTRY_ADDRESS)} rel="noopener" target="_blank">
                    <code>{shortHex(REGISTRY_ADDRESS)}</code> <ExternalLink size={12} aria-hidden="true" />
                  </a>
                ) : (
                  <span className="dash">Not configured</span>
                )}
              </dd>
              <dt>Purpose</dt>
              <dd>Record one digest. No token approval, no transfer.</dd>
            </dl>
            <div className="export-row" style={{ marginTop: 16 }}>
              {wallet.available && !wallet.account && (
                <button className="b" onClick={wallet.connect} disabled={wallet.connecting}>
                  {wallet.connecting ? "Connecting…" : "Connect wallet"}
                </button>
              )}
              {wallet.account && !onTarget && (
                <button className="b" onClick={wallet.switchNetwork}>Switch network</button>
              )}
            </div>
            {wallet.error && <p className="help is-bad" style={{ marginTop: 8 }}>{wallet.error}</p>}
          </section>

          <section className="card" aria-labelledby="h-tx">
            <div className="card-head">
              <h2 id="h-tx">Transaction</h2>
              <span className="meta">You pay the network gas</span>
            </div>
            <ol className="tx-steps">
              {STEPS.map((s) => (
                <li key={s.kind} className={reached(s.kind) ? "is-done" : ""}>
                  <span className="tx-dot" aria-hidden="true" />
                  {s.kind === "confirmed" && tx.kind === "confirmed"
                    ? `Confirmed at block ${tx.blockNumber.toLocaleString("en-GB")}`
                    : s.label}
                </li>
              ))}
            </ol>
            {tx.kind === "rejected" && <p className="help is-bad">You rejected the request in your wallet. Nothing was recorded.</p>}
            {tx.kind === "reverted" && <p className="help is-bad">{tx.reason} Nothing was recorded.</p>}
            {tx.kind === "timeout" && (
              <p className="help is-bad">
                No confirmation after 120 s. It may still confirm: <a href={txUrl(tx.hash)} rel="noopener" target="_blank">check it on BOTScan</a>. Loxen will not
                mark it recorded until it does.
              </p>
            )}
            {tx.kind === "error" && <p className="help is-bad">{tx.reason}</p>}
            {(tx.kind === "pending" || tx.kind === "confirmed") && (
              <p className="note">
                <a href={txUrl(tx.hash)} rel="noopener" target="_blank">
                  <code>{shortHex(tx.hash)}</code> on BOTScan <ExternalLink size={12} aria-hidden="true" />
                </a>
              </p>
            )}
            {tx.kind === "confirmed" && brief && (
              <p className="help is-ok">Receipt {tx.receiptId.toString()} confirmed. Your receipt package has been downloaded.</p>
            )}
            <button className="b b-primary rail-action" onClick={commit} disabled={!!blocker || busy || !digest}>
              {busy ? "Working…" : "Commit receipt"}
            </button>
            {blocker && <p className="note" style={{ marginTop: 8 }}>{blocker}</p>}
          </section>
        </div>
      </div>
    </>
  );
}
