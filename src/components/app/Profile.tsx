"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { REGISTRY_ADDRESS, TARGET_CHAIN, chainName } from "@/lib/chains";
import { ExplorerLink } from "./ExplorerLink";
import { shortHex } from "@/lib/digest";
import { summary } from "@/lib/evaluate";
import { receiptsByOwner, type ReadResult, type ReceiptRow } from "@/lib/registry";
import { horizonOf, lensOf, type Brief } from "@/lib/schema";
import { deleteBrief, listBriefs } from "@/lib/storage";
import { briefToJSON, download } from "@/lib/export";
import { useWallet } from "@/lib/wallet";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

export function Profile() {
  const wallet = useWallet();
  const [briefs, setBriefs] = useState<Brief[] | null>(null);
  const [chainRead, setChainRead] = useState<ReadResult<{ count: number; rows: ReceiptRow[] }> | null>(null);

  useEffect(() => setBriefs(listBriefs()), []);
  useEffect(() => {
    if (!wallet.account) return;
    setChainRead(null);
    receiptsByOwner(wallet.account).then(setChainRead);
  }, [wallet.account]);

  const latest = chainRead?.ok ? chainRead.data.rows[0] : undefined;
  const committedLocally = briefs?.filter((b) => b.receipt).length ?? 0;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Your records</h1>
          <p className="title-sub">
            {wallet.account ? (
              <>
                <code>{shortHex(wallet.account)}</code> · {chainName(wallet.chainId)}
                {wallet.chainId !== TARGET_CHAIN.id && " · receipts are read from " + TARGET_CHAIN.name}
              </>
            ) : (
              "Connect a wallet to see receipts it committed. Local briefs are listed either way."
            )}
          </p>
        </div>
        <div className="title-actions">
          {wallet.available && !wallet.account && (
            <button className="b" onClick={wallet.connect} disabled={wallet.connecting}>
              {wallet.connecting ? "Connecting…" : "Connect wallet"}
            </button>
          )}
          <Link className="b b-primary" href="/workbench">New brief</Link>
        </div>
      </div>

      <div className="profile-grid">
        <section className="card profile-chain" aria-labelledby="h-chain">
          <div className="card-head">
            <h2 id="h-chain">On BOT Chain</h2>
            <span className="meta">{TARGET_CHAIN.name}</span>
          </div>
          <dl className="figures">
            <div>
              <dt>Receipts by this wallet</dt>
              <dd className="num">
                {chainRead?.ok ? chainRead.data.count.toLocaleString("en-GB") : <span className="dash">—</span>}
              </dd>
            </div>
            <div>
              <dt>Latest confirmed</dt>
              <dd className="num">
                {latest ? `Receipt ${latest.receiptId}` : <span className="dash">—</span>}
              </dd>
            </div>
          </dl>
          <p className="note" style={{ marginTop: 12 }}>
            {!REGISTRY_ADDRESS
              ? "The registry address is not set for this deployment, so receipts cannot be read. That is not the same as having none."
              : wallet.available === false
                ? "No wallet found in this browser. Search any wallet’s receipts on the History screen."
                : !wallet.account
                  ? "Connect a wallet to read its receipts."
                  : chainRead === null
                    ? "Reading the registry…"
                    : !chainRead.ok
                      ? `Couldn’t read the registry: ${chainRead.message} This is not the same as no receipts.`
                      : chainRead.data.count === 0
                        ? "This wallet has not committed a receipt."
                        : `Read from block events in the last 50,000 blocks.`}
          </p>
          {chainRead?.ok && chainRead.data.rows.length > 0 && (
            <ul className="mini-list">
              {chainRead.data.rows.slice(0, 5).map((r) => (
                <li key={r.receiptId}>
                  <span className="ident">Receipt {r.receiptId}</span>
                  <span className="num">{new Date(r.timestamp * 1000).toLocaleDateString("en-GB")}</span>
                  <span className="sub">
                    <code>{shortHex(r.digest, 8, 6)}</code>
                    {r.txHash && (
                      <>
                        {" · "}
                        <ExplorerLink kind="tx" value={r.txHash} label="Transaction" />
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="note" style={{ marginTop: 16 }}>
            Connecting a wallet proves nothing about who you are, and makes you eligible for nothing.
          </p>
        </section>

        <section className="card profile-local" aria-labelledby="h-local">
          <div className="card-head">
            <h2 id="h-local">Only on this device</h2>
            <span className="meta">
              {briefs ? `${briefs.length} ${briefs.length === 1 ? "brief" : "briefs"} · ${committedLocally} with a receipt` : ""}
            </span>
          </div>
          {briefs === null ? (
            <div aria-busy="true" aria-label="Loading briefs">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton" style={{ height: 20, marginTop: i ? 22 : 0 }} />
              ))}
            </div>
          ) : briefs.length === 0 ? (
            <p className="empty">
              No briefs saved in this browser. <Link href="/workbench">Start one in the workbench</Link>; it stays here until
              you delete it.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Brief</th>
                    <th>Horizon and lens</th>
                    <th className="num">Parts</th>
                    <th className="num">Saved</th>
                    <th>Record</th>
                  </tr>
                </thead>
                <tbody>
                  {briefs.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <Link className="ident" href={`/brief/${b.id}`}>{b.question || "Untitled brief"}</Link>
                        <span className="sub">{b.asset.contract ? shortHex(b.asset.contract) : b.asset.query || "No asset"}</span>
                      </td>
                      <td className="m-line2">
                        {horizonOf(b.horizon).label}
                        <span className="sub">{lensOf(b.lens).label}</span>
                      </td>
                      <td className="num m-line2">{summary(b).filledCount} / 12</td>
                      <td className="num m-line2">{fmt(b.updatedAt)}</td>
                      <td className="m-line2">
                        {b.receipt ? (
                          <span className="pill pill-pos">Receipt {b.receipt.receiptId}</span>
                        ) : (
                          <span className="pill">Local only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <DeviceData briefs={briefs} onCleared={() => setBriefs([])} />
      </div>
    </>
  );
}

function DeviceData({ briefs, onCleared }: { briefs: Brief[] | null; onCleared: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [bytes, setBytes] = useState<number | null>(null);
  useEffect(() => {
    try {
      setBytes(new Blob([window.localStorage.getItem("loxen.briefs.v1") ?? ""]).size);
    } catch {
      setBytes(null);
    }
  }, [briefs]);
  const values = briefs?.reduce((n, b) => n + b.evidence.length, 0) ?? 0;
  const oldest = briefs?.length ? briefs.reduce((a, b) => (a.createdAt < b.createdAt ? a : b)).createdAt : null;

  return (
    <section className="card profile-device" aria-labelledby="h-device">
      <div className="card-head">
        <h2 id="h-device">Data on this device</h2>
        <span className="meta">Browser local storage</span>
      </div>
      <dl className="kv">
        <dt>Briefs</dt>
        <dd className="num">{briefs ? briefs.length : <span className="dash">—</span>}</dd>
        <dt>Evidence values</dt>
        <dd className="num">{briefs ? values : <span className="dash">—</span>}</dd>
        <dt>Storage used</dt>
        <dd className="num">{bytes == null ? <span className="dash">—</span> : `${(bytes / 1024).toFixed(1)} KB`}</dd>
        <dt>Oldest brief</dt>
        <dd className="num">{oldest ? fmt(oldest) : <span className="dash">—</span>}</dd>
      </dl>
      <p className="note" style={{ marginTop: 12 }}>
        Nothing here is sent to a server. Clearing this site’s data deletes it, and an on-chain receipt stays on BOT Chain
        either way.
      </p>
      <div className="export-row" style={{ marginTop: 16 }}>
        <button
          className="b"
          disabled={!briefs?.length}
          onClick={() =>
            briefs &&
            download(
              "loxen-briefs.json",
              JSON.stringify({ exportedAt: new Date().toISOString(), briefs: briefs.map((b) => briefToJSON(b)) }, null, 2),
              "application/json",
            )
          }
        >
          Export all
        </button>
        {confirming ? (
          <>
            <button
              className="b b-danger"
              onClick={() => {
                briefs?.forEach((b) => deleteBrief(b.id));
                setConfirming(false);
                onCleared();
              }}
            >
              Delete {briefs?.length ?? 0} {briefs?.length === 1 ? "brief" : "briefs"}
            </button>
            <button className="b b-text" onClick={() => setConfirming(false)}>Keep them</button>
          </>
        ) : (
          <button className="b b-text b-danger-text" disabled={!briefs?.length} onClick={() => setConfirming(true)}>
            Delete all from this device…
          </button>
        )}
      </div>
    </section>
  );
}
