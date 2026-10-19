"use client";

import { useState } from "react";

/** The workbench's "New brief" dialog, already open. Carries the question into /workbench. */
export function StartDialog() {
  const [h, setH] = useState<"days" | "weeks">("weeks");
  return (
    <form className="ui start-dialog" action="/workbench" method="get" data-ui>
      <h3 className="sd-title">New brief</h3>
      <label htmlFor="sd-q" className="sd-label">Question</label>
      <textarea
        id="sd-q"
        name="q"
        rows={2}
        maxLength={280}
        className="sd-input"
        defaultValue="What would make this pool too thin for a two-week view?"
      />
      <fieldset className="sd-seg">
        <legend className="sd-label">Horizon</legend>
        <div className="sd-seg-row">
          <label className={h === "days" ? "is-on" : ""}>
            <input type="radio" name="h" value="days" checked={h === "days"} onChange={() => setH("days")} />
            1–7 days
          </label>
          <label className={h === "weeks" ? "is-on" : ""}>
            <input type="radio" name="h" value="weeks" checked={h === "weeks"} onChange={() => setH("weeks")} />
            1–4 weeks
          </label>
        </div>
      </fieldset>
      <button type="submit" className="sd-submit">Open the workbench</button>
      <p className="sd-foot">Stays in this browser. No wallet needed.</p>
    </form>
  );
}
