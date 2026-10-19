"use client";

import { useState } from "react";
import { digestOf, shortHex } from "@/lib/digest";

type Result =
  | { state: "idle" }
  | { state: "bad"; reason: string }
  | { state: "match"; digest: string; receiptId: string }
  | { state: "mismatch"; computed: string; recorded: string };

/** Recomputes a receipt package's digest in the browser and compares it with the recorded one. */
export function PackageCheck() {
  const [result, setResult] = useState<Result>({ state: "idle" });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2_000_000) return setResult({ state: "bad", reason: "That file is larger than a receipt package can be." });
    try {
      const pkg = JSON.parse(await file.text());
      const r = pkg?.receipt;
      if (!pkg?.brief || typeof pkg?.salt !== "string" || !r?.digest || !r?.owner || !r?.chainId) {
        return setResult({ state: "bad", reason: "This is not a Loxen receipt package: it needs brief, salt and receipt fields." });
      }
      const computed = digestOf({ brief: pkg.brief, salt: pkg.salt, owner: r.owner, chainId: r.chainId });
      setResult(
        computed.toLowerCase() === String(r.digest).toLowerCase()
          ? { state: "match", digest: computed, receiptId: String(r.receiptId) }
          : { state: "mismatch", computed, recorded: String(r.digest) },
      );
    } catch {
      setResult({ state: "bad", reason: "The file could not be read as JSON." });
    }
  };

  return (
    <section className="card" aria-labelledby="h-pkg">
      <div className="card-head">
        <h2 id="h-pkg">Check a receipt package</h2>
        <span className="meta">Runs in this browser</span>
      </div>
      <p>
        Someone shared a brief and its receipt package? Recompute the digest here, then search the receipt ID to see the
        same digest on BOT Chain.
      </p>
      <label className="drop">
        <input type="file" accept="application/json,.json" onChange={(e) => onFile(e.target.files?.[0])} />
        <span className="b">Choose package (.json)</span>
        <span className="note">The file is read locally and never uploaded.</span>
      </label>
      {result.state === "bad" && <p className="help is-bad">{result.reason}</p>}
      {result.state === "match" && (
        <p className="help is-ok">
          The package matches its digest <code>{shortHex(result.digest, 10, 6)}</code>. Search receipt {result.receiptId} to confirm it
          was recorded.
        </p>
      )}
      {result.state === "mismatch" && (
        <p className="help is-bad">
          Does not match. Computed <code>{shortHex(result.computed, 10, 6)}</code>, recorded <code>{shortHex(result.recorded, 10, 6)}</code>. The
          brief or salt was changed after the receipt.
        </p>
      )}
    </section>
  );
}
