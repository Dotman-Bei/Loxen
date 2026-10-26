"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { StatusMark } from "@/components/StatusMark";
import { checkAsset } from "@/lib/evaluate";
import { PROVIDER_DEFS, isEnabled } from "@/lib/providers";
import type { Brief } from "@/lib/schema";

type Health = { id: string; lastSuccess: string | null; lastError: { at: string; message: string } | null };
type Outcome = { providerId: string; served: "live" | "cache" | "error"; error?: { code: string; message: string } };
type EvidenceResponse = {
  asset: { name?: string; symbol?: string; standard?: string; isContract?: boolean } | null;
  records: Brief["evidence"];
  outcomes: Outcome[];
  fetchedAt: string;
};

const fmt = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Provider health and the one action that reads live data for the brief's contract. */
export function SourcesCard({ brief, update }: { brief: Brief; update: (p: Partial<Brief>) => void }) {
  const [health, setHealth] = useState<Health[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ at: string; outcomes: Outcome[] } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const loadHealth = () =>
    fetch("/api/providers", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setHealth(j.providers))
      .catch(() => setHealth([]));
  useEffect(() => {
    loadHealth();
  }, []);

  const asset = checkAsset(brief.asset.query);
  const onBot = brief.asset.network === "botchain";
  const blocker =
    asset.kind !== "address" || !asset.ok
      ? "Enter a valid contract address to read live data."
      : !onBot
        ? "Live providers cover BOT Chain only. Choose BOT Chain mainnet, or enter values by hand."
        : null;

  const fetchEvidence = async () => {
    if (blocker || asset.kind !== "address" || !asset.ok) return;
    setBusy(true);
    setFailure(null);
    try {
      const res = await fetch(`/api/evidence?address=${asset.checksummed}&network=${brief.asset.network}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) {
        setFailure(body.error ?? "The lookup failed.");
        return;
      }
      const r = body as EvidenceResponse;
      const errors = r.outcomes
        .filter((o) => o.error && o.error.code !== "not-contract" && o.error.code !== "not-found")
        .map((o) => ({ providerId: o.providerId, message: o.error!.message, at: r.fetchedAt }));
      const notContract = r.outcomes.find((o) => o.error?.code === "not-contract" || o.error?.code === "not-found");
      update({
        // Replace earlier provider values for this brief; keep everything you entered.
        evidence: [...brief.evidence.filter((e) => e.providerId === "user"), ...r.records],
        providerErrors: errors,
        asset: { ...brief.asset, name: r.asset?.name, symbol: r.asset?.symbol },
      });
      if (notContract?.error) setFailure(notContract.error.message);
      setLast({ at: r.fetchedAt, outcomes: r.outcomes });
    } catch {
      setFailure("Couldn’t reach Loxen’s provider service. Nothing was changed.");
    } finally {
      setBusy(false);
      loadHealth();
    }
  };

  const enabled = PROVIDER_DEFS.filter((p) => p.adapter && isEnabled(p.id));
  const providerRecords = brief.evidence.filter((e) => e.providerId !== "user").length;

  return (
    <section className="card" id="card-sources" aria-labelledby="h-sources">
      <div className="card-head">
        <h2 id="h-sources">Sources</h2>
        <span className="meta">
          {enabled.length} of {PROVIDER_DEFS.length} providers enabled
        </span>
      </div>
      <ul className="providers">
        {PROVIDER_DEFS.map((p) => {
          const on = p.adapter && isEnabled(p.id);
          const h = health?.find((x) => x.id === p.id);
          const outcome = last?.outcomes.find((o) => o.providerId === p.id);
          let state: React.ReactNode;
          if (!on) state = <StatusMark status="unavailable" detail={p.adapter ? "Turned off" : "Planned"} />;
          else if (outcome?.served === "live") state = <StatusMark status="live" detail={`read ${fmt(last!.at)}`} />;
          else if (outcome?.served === "cache") state = <StatusMark status="cached" detail="read in the last minute" />;
          else if (outcome?.served === "error" && outcome.error?.code !== "not-contract" && outcome.error?.code !== "not-found")
            state = <StatusMark status="unavailable" detail={outcome.error?.message} />;
          else state = <span className="note">Ready</span>;
          return (
            <li key={p.id} className="provider">
              <span className="ident">{p.label}</span>
              {state}
              <span className="sub">{p.covers}</span>
              <span className="sub">
                {!on
                  ? p.note
                  : h?.lastError && (!h.lastSuccess || h.lastError.at > h.lastSuccess)
                    ? `Last error ${fmt(h.lastError.at)}: ${h.lastError.message}`
                    : h?.lastSuccess
                      ? `Last good fetch ${fmt(h.lastSuccess)}`
                      : "No fetch yet on this server"}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="fetch-row">
        <button className="b b-primary" onClick={fetchEvidence} disabled={!!blocker || busy}>
          <RefreshCw size={14} aria-hidden="true" className={busy ? "spin" : undefined} />
          {busy ? "Reading…" : providerRecords ? "Fetch again" : "Fetch evidence"}
        </button>
        <span className="note" aria-live="polite">
          {failure ??
            blocker ??
            (providerRecords
              ? `${providerRecords} provider values in this brief. Values you entered are kept.`
              : "Reads contract data from BOTScan and the BOT Chain RPC. Only the address is sent.")}
        </span>
      </div>
      {brief.asset.name && (
        <p className="help is-ok" style={{ marginTop: 8 }}>
          Resolved as {brief.asset.name}
          {brief.asset.symbol ? ` (${brief.asset.symbol})` : ""}. Check this is the asset you mean.
        </p>
      )}
    </section>
  );
}
