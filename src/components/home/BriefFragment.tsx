import { StatusMark } from "@/components/StatusMark";
import type { Lens } from "@/lib/schema";
import { EXAMPLE, EXAMPLE_ROWS, EXAMPLE_RULES } from "./exampleBrief";

const VERDICT = { holds: "Holds", past: "Already past", cannot: "Cannot evaluate" } as const;

/** A working piece of the brief preview, as the workbench renders it. */
export function BriefFragment({ lens }: { lens: Lens }) {
  return (
    <div className="ui brief-frag" data-ui>
      <div className="frag-head">
        <span className="frag-kind">Example brief</span>
        <span className="frag-meta">{EXAMPLE.horizon}</span>
      </div>
      <p className="frag-q">{EXAMPLE.question}</p>
      <p className="frag-asset">
        {EXAMPLE.asset} · {EXAMPLE.network} · <code>{EXAMPLE.contract}</code>
      </p>
      {lens === "risk" ? (
        <ul className="frag-rows">
          {EXAMPLE_RULES.map((r) => (
            <li key={r.text} className="frag-row">
              <span className="frag-metric">{r.text}</span>
              <span className={`frag-verdict v-${r.verdict}`}>{VERDICT[r.verdict]}</span>
              <span className="frag-note">{r.note}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="frag-rows">
          {EXAMPLE_ROWS[lens].map((r) => (
            <li key={r.metric} className="frag-row">
              <span className="frag-metric">{r.metric}</span>
              <span className={`frag-value num${r.value === "—" ? " is-dash" : ""}`}>{r.value}</span>
              <span className="frag-note">
                {r.status === "calc" ? <span className="calc-word">Calculation</span> : <StatusMark status={r.status} />}
                <span className="frag-note-text">{r.note}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="frag-mode">Generated from user-provided inputs and local template logic. No live sources.</p>
    </div>
  );
}
