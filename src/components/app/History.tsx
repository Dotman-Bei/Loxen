"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { REGISTRY_ADDRESS, TARGET_CHAIN } from "@/lib/chains";
import { shortHex } from "@/lib/digest";
import { ADDRESS_RE } from "@/lib/schema";
import { receiptById, receiptsByOwner, recentReceipts, type ReadResult, type ReceiptRow } from "@/lib/registry";
import { PackageCheck } from "./PackageCheck";
import { ReceiptTable } from "./ReceiptTable";

type Lookup =
  | { state: "idle" }
  | { state: "invalid" }
  | { state: "loading"; query: string }
  | { state: "done"; query: string; label: string; result: ReadResult<ReceiptRow[]> };

export function History() {
  const [q, setQ] = useState("");
  const [lookup, setLookup] = useState<Lookup>({ state: "idle" });
  const [recent, setRecent] = useState<ReadResult<ReceiptRow[]> | null>(null);

  const loadRecent = useCallback(async () => {
    setRecent(null);
    setRecent(await recentReceipts(20));
  }, []);
  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = q.trim();
    if (!query) return;
    if (ADDRESS_RE.test(query)) {
      setLookup({ state: "loading", query });
      const r = await receiptsByOwner(query as `0x${string}`);
      setLookup({ state: "done", query, label: `wallet ${shortHex(query)}`, result: r.ok ? { ok: true, data: r.data.rows } : r });
    } else if (/^\d{1,30}$/.test(query)) {
      setLookup({ state: "loading", query });
      const r = await receiptById(BigInt(query));
      setLookup({ state: "done", query, label: `receipt ${query}`, result: r.ok ? { ok: true, data: r.data ? [r.data] : [] } : r });
    } else {
      setLookup({ state: "invalid" });
    }
  };

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Receipt history</h1>
          <p className="title-sub">Public receipts recorded on {TARGET_CHAIN.name} by the Loxen registry.</p>
        </div>
      </div>

      <div className="hist-top">
      <section className="card search-card" aria-labelledby="h-search">
        <div className="card-head">
          <h2 id="h-search">Look up a receipt</h2>
          <span className="meta">Reads BOT Chain directly. Nothing is stored.</span>
        </div>
        <form className="search-row" onSubmit={search} role="search">
          <label className="visually-hidden" htmlFor="hq">Wallet address or receipt ID</label>
          <div className="search-input">
            <Search size={14} aria-hidden="true" />
            <input
              id="hq"
              className="input"
              placeholder="Wallet address or receipt ID"
              value={q}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button type="submit" className="b b-primary" disabled={!q.trim() || lookup.state === "loading"}>
            {lookup.state === "loading" ? "Searching…" : "Search"}
          </button>
        </form>
        {lookup.state === "idle" && (
          <p className="help" style={{ marginTop: 8 }}>
            A wallet address lists every receipt it committed in the last 50,000 blocks. A receipt number shows that one
            receipt, with its owner, digest and time.
          </p>
        )}
        {lookup.state === "invalid" && (
          <p className="help is-bad" style={{ marginTop: 8 }}>
            Enter a wallet address (0x and 40 hexadecimal characters) or a receipt number.
          </p>
        )}
        {lookup.state === "done" && (
          <div style={{ marginTop: 16 }}>
            {lookup.result.ok ? (
              <ReceiptTable
                rows={lookup.result.data}
                empty={`No receipt found for ${lookup.label} on ${TARGET_CHAIN.name}.`}
              />
            ) : (
              <ReadError result={lookup.result} onRetry={() => search()} />
            )}
          </div>
        )}
      </section>
      <PackageCheck />
      </div>

      <section className="card hist-recent" aria-labelledby="h-recent">
        <div className="card-head">
          <h2 id="h-recent">Recent receipts</h2>
          <span className="meta">{REGISTRY_ADDRESS ? "Last 50,000 blocks, newest first, up to 20" : "Registry not configured"}</span>
        </div>
        {recent === null ? (
          <div className="loading-rows" aria-busy="true" aria-label="Loading receipts">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 20, marginTop: i ? 22 : 0 }} />
            ))}
          </div>
        ) : recent.ok ? (
          <ReceiptTable rows={recent.data} empty="No receipts have been recorded in the last 50,000 blocks." />
        ) : (
          <ReadError result={recent} onRetry={recent.reason === "rpc" ? loadRecent : undefined} />
        )}
      </section>

      <div className="hist-bounds">
        <section className="card" aria-labelledby="h-proves">
          <div className="card-head">
            <h2 id="h-proves">What a receipt proves</h2>
          </div>
          <ul className="pv-list">
            <li>A wallet submitted this exact digest to the registry.</li>
            <li>It did so at a specific block, at that block’s time.</li>
            <li>The brief and salt in a package produce that digest, if the check above matches.</li>
            <li>Which schema version the brief was written in.</li>
          </ul>
        </section>
        <section className="card" aria-labelledby="h-not">
          <div className="card-head">
            <h2 id="h-not">What it does not prove</h2>
          </div>
          <ul className="pv-list">
            <li>That the brief is accurate, or that its sources were honest.</li>
            <li>That any value was live when the brief was written.</li>
            <li>Who holds the wallet. A wallet is not a person.</li>
            <li>Anything about returns. A receipt is not a signal and earns nothing.</li>
          </ul>
        </section>
      </div>
    </>
  );
}

function ReadError({ result, onRetry }: { result: Extract<ReadResult<unknown>, { ok: false }>; onRetry?: () => void }) {
  return (
    <>
      <ReceiptTable
        rows={[]}
        empty={
          <span>
            {result.reason === "rpc" ? `Couldn’t read the registry: ${result.message} This is not the same as no receipts.` : result.message}{" "}
            {onRetry && (
              <button className="b b-text" onClick={onRetry}>
                Retry
              </button>
            )}
          </span>
        }
      />
    </>
  );
}
