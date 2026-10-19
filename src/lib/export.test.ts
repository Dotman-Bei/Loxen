import { describe, expect, it } from "vitest";
import { briefToJSON, briefToMarkdown, slug } from "./export";
import { SCHEMA_ID, type Brief } from "./schema";

const brief: Brief = {
  id: "b_x",
  schema: SCHEMA_ID,
  question: "Is the pool | deep * enough?",
  asset: { query: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed", network: "bohr", contract: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed" },
  horizon: "weeks",
  lens: "liquidity",
  evidence: [
    {
      id: "e1",
      metricName: "Pool liquidity",
      value: "184,200",
      unit: "USD",
      kind: "source",
      providerId: "user",
      sourceLabel: "Pool page",
      sourceUrl: "https://example.org/pool",
      collectedAt: new Date().toISOString(),
      sourceTimestamp: new Date().toISOString(),
      status: "user",
    },
  ],
  rules: [{ id: "r", text: "Liquidity below 10,000 USD", type: "threshold", requires: ["Pool liquidity"], fromTemplate: false }],
  risks: "One pool holds most liquidity.",
  unknowns: "",
  limitations: "",
  privateNotes: "my size is 5,000",
  createdAt: "2026-10-19T10:00:00.000Z",
  updatedAt: "2026-10-19T11:00:00.000Z",
};

describe("Markdown export", () => {
  const md = briefToMarkdown(brief);
  it("carries the schema, record state and every part", () => {
    expect(md).toContain(`Schema \`${SCHEMA_ID}\` · Local only`);
    for (const h of ["## Asset", "## Evidence", "## Risks", "## Invalidation", "## Unknowns", "## Limitations"]) expect(md).toContain(h);
  });
  it("keeps missing values as unavailable rows", () => {
    expect(md).toMatch(/\| 24-hour volume \| — \| Source data \| — \| — \| Unavailable/);
  });
  it("escapes table and emphasis characters from user text", () => {
    expect(md).toContain("# Is the pool \\| deep \\* enough?");
  });
  it("never includes private notes", () => {
    expect(md).not.toContain("my size is");
  });
});

describe("JSON export", () => {
  it("leaves private notes out by default and labels the record", () => {
    const j = briefToJSON(brief);
    expect((j.brief as Record<string, unknown>).privateNotes).toBeUndefined();
    expect(j).toMatchObject({ schema: SCHEMA_ID, record: "local-only" });
    expect(j.generatedFrom).toMatch(/user-provided inputs/);
    expect(j.derived.unavailable.map((m) => m.metric)).toEqual(["24-hour volume", "Slippage at your size"]);
  });
  it("includes them only when asked", () => {
    expect((briefToJSON(brief, true).brief as Record<string, unknown>).privateNotes).toBe("my size is 5,000");
  });
});

describe("file names", () => {
  it("slugs the question", () => {
    expect(slug(brief)).toBe("is-the-pool-deep-enough");
    expect(slug({ ...brief, question: "" })).toBe("brief");
  });
});
