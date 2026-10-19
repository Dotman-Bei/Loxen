"use client";

import Link from "next/link";
import { useState } from "react";
import { LENSES, type Lens } from "@/lib/schema";
import { BriefFragment } from "./BriefFragment";
import { LENS_COPY } from "./exampleBrief";

export function LensShowcase() {
  const [lens, setLens] = useState<Lens>("liquidity");
  return (
    <section className="showcase" aria-labelledby="lenses-title">
      <div className="showcase-plate tag" data-reveal style={{ ["--i" as string]: 2 }}>
        <span className="tag-hole" style={{ ["--hole-bg" as string]: "var(--surface)" }} />
        <BriefFragment lens={lens} />
      </div>
      <div className="showcase-text">
        <div className="lens-tabs" role="tablist" aria-label="Research lens" data-reveal>
          {LENSES.map((l) => (
            <button
              key={l.id}
              role="tab"
              aria-selected={lens === l.id}
              className="lens-tab"
              onClick={() => setLens(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div data-reveal style={{ ["--i" as string]: 1 }}>
          <h2 id="lenses-title" className="h-section">One question, four lenses</h2>
          <p className="showcase-desc" aria-live="polite">{LENS_COPY[lens]}</p>
        </div>
        <div className="action-cells" data-reveal style={{ ["--i" as string]: 2 }}>
          <Link href="/workbench" className="cell cell-ink">Open the workbench</Link>
          <Link href="/methodology" className="cell cell-tone">Read the method</Link>
        </div>
      </div>
    </section>
  );
}
