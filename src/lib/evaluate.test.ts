import { describe, expect, it } from "vitest";
import {
  LIVE_WINDOW_MS,
  autoLimitations,
  autoUnknowns,
  checkAsset,
  checkRules,
  evaluateEvidence,
  missingMetrics,
  partsFilled,
  sourceMode,
  summary,
} from "./evaluate";
import { SCHEMA_ID, type Brief, type Evidence } from "./schema";

const NOW = Date.parse("2026-10-19T12:00:00Z");
const minsAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

function brief(patch: Partial<Brief> = {}): Brief {
  return {
    id: "b_test",
    schema: SCHEMA_ID,
    question: "Is the pool deep enough?",
    asset: { query: "", network: "botchain", contract: "" },
    horizon: "weeks",
    lens: "liquidity",
    evidence: [],
    rules: [],
    risks: "",
    unknowns: "",
    limitations: "",
    privateNotes: "",
    createdAt: minsAgo(60),
    updatedAt: minsAgo(1),
    ...patch,
  };
}

let n = 0;
function ev(patch: Partial<Evidence>): Evidence {
  return {
    id: `e${++n}`,
    metricName: "Pool liquidity",
    value: "100",
    unit: "USD",
    kind: "source",
    providerId: "user",
    sourceLabel: "Pool page",
    sourceUrl: "",
    collectedAt: minsAgo(5),
    sourceTimestamp: minsAgo(5),
    status: "user",
    ...patch,
  };
}

describe("stale and live windows", () => {
  it("marks source data older than the horizon allows as stale, with its age", () => {
    const b = brief({ horizon: "days", evidence: [ev({ sourceTimestamp: minsAgo(7 * 60) })] }); // 6 h limit
    const [row] = evaluateEvidence(b, NOW);
    expect(row.effective).toBe("stale");
    expect(row.age).toBe("7 h old");
  });

  it("keeps fresh source data in its own state", () => {
    const [row] = evaluateEvidence(brief({ horizon: "intraday", evidence: [ev({ sourceTimestamp: minsAgo(10) })] }), NOW);
    expect(row.effective).toBe("user");
  });

  it("never marks a calculation stale by age", () => {
    const [row] = evaluateEvidence(brief({ horizon: "intraday", evidence: [ev({ kind: "calculation", sourceTimestamp: minsAgo(600) })] }), NOW);
    expect(row.effective).toBe("user");
  });

  it("shows a live provider value as cached once the live window has passed", () => {
    const fresh = ev({ providerId: "botscan", status: "live", collectedAt: minsAgo(2) });
    const old = ev({ providerId: "botscan", status: "live", collectedAt: new Date(NOW - LIVE_WINDOW_MS - 1000).toISOString() });
    const [a, b] = evaluateEvidence(brief({ evidence: [fresh, old] }), NOW);
    expect(a.effective).toBe("live");
    expect(b.effective).toBe("cached");
  });
});

describe("conflicts", () => {
  it("flags two prices more than 2% apart and states the gap", () => {
    const rows = evaluateEvidence(
      brief({ evidence: [ev({ metricName: "Total supply", value: "1,000" }), ev({ metricName: "Total supply", value: "1,030" })] }),
      NOW,
    );
    expect(rows.every((r) => r.effective === "conflicting")).toBe(true);
    expect(rows[0].conflictWith).toBe("2 sources 3.0% apart");
  });

  it("tolerates small price differences", () => {
    const rows = evaluateEvidence(
      brief({ evidence: [ev({ metricName: "Total supply", value: "1000" }), ev({ metricName: "Total supply", value: "1010" })] }),
      NOW,
    );
    expect(rows.some((r) => r.effective === "conflicting")).toBe(false);
  });

  it("uses the 10% threshold for counts", () => {
    const close = evaluateEvidence(brief({ evidence: [ev({ metricName: "Holder count", value: "100" }), ev({ metricName: "Holder count", value: "109" })] }), NOW);
    const far = evaluateEvidence(brief({ evidence: [ev({ metricName: "Holder count", value: "100" }), ev({ metricName: "Holder count", value: "111" })] }), NOW);
    expect(close.some((r) => r.effective === "conflicting")).toBe(false);
    expect(far.every((r) => r.effective === "conflicting")).toBe(true);
  });

  it("leaves unavailable values out of the comparison", () => {
    const rows = evaluateEvidence(
      brief({ evidence: [ev({ metricName: "Total supply", value: "1000" }), ev({ metricName: "Total supply", value: "", status: "unavailable" })] }),
      NOW,
    );
    expect(rows.map((r) => r.effective)).toEqual(["user", "unavailable"]);
  });
});

describe("missing values say why", () => {
  it("lists the lens metrics with no value", () => {
    const missing = missingMetrics(brief({ evidence: [ev({ metricName: "Pool liquidity" })] }));
    expect(missing.map((m) => m.metric)).toEqual(["24-hour volume", "Slippage at your size"]);
    expect(missing[0].reason).toMatch(/No provider covers it/);
  });

  it("invites a fetch when a provider could supply the metric", () => {
    const [holder] = missingMetrics(brief({ lens: "onchain" }));
    expect(holder.metric).toBe("Holder count");
    expect(holder.reason).toMatch(/Not fetched yet/);
  });

  it("names the provider that failed", () => {
    const b = brief({ lens: "onchain", providerErrors: [{ providerId: "botscan", message: "Did not answer in time.", at: minsAgo(1) }] });
    expect(missingMetrics(b)[0].reason).toBe("BOTScan did not answer: Did not answer in time.");
  });

  it("treats an unavailable record as missing", () => {
    const b = brief({ lens: "onchain", evidence: [ev({ metricName: "Holder count", status: "unavailable", providerId: "botscan" })] });
    expect(missingMetrics(b).map((m) => m.metric)).toContain("Holder count");
  });
});

describe("rules", () => {
  it("can evaluate only when every required metric has a value", () => {
    const b = brief({
      evidence: [ev({ metricName: "Pool liquidity" })],
      rules: [
        { id: "r1", text: "Liquidity falls", type: "threshold", requires: ["Pool liquidity"], fromTemplate: false },
        { id: "r2", text: "Venue stops quoting", type: "qualitative", requires: ["Order book depth"], fromTemplate: true },
      ],
    });
    const [a, c] = checkRules(b);
    expect(a.evaluable).toBe(true);
    expect(c).toMatchObject({ evaluable: false, missing: ["Order book depth"] });
    expect(summary(b).cannot).toBe(1);
  });
});

describe("asset check", () => {
  it("accepts a correctly checksummed address", () => {
    expect(checkAsset("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed")).toMatchObject({ kind: "address", ok: true });
  });
  it("accepts an all-lowercase address and returns the checksummed form", () => {
    expect(checkAsset("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed")).toEqual({
      kind: "address",
      ok: true,
      checksummed: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
    });
  });
  it("rejects a mixed-case address with a wrong checksum", () => {
    expect(checkAsset("0x5AAeb6053F3E94C9b9A09f33669435E7Ef1BeAed")).toMatchObject({ kind: "address", ok: false });
  });
  it("rejects the wrong length", () => {
    expect(checkAsset("0x1234")).toMatchObject({ kind: "address", ok: false });
  });
  it("treats anything else as a symbol and nothing as empty", () => {
    expect(checkAsset("BOWETH")).toEqual({ kind: "symbol" });
    expect(checkAsset("  ")).toEqual({ kind: "empty" });
  });
});

describe("summaries", () => {
  it("does not repeat an unknown when two rows share a conflict", () => {
    const b = brief({ evidence: [ev({ metricName: "Total supply", value: "1" }), ev({ metricName: "Total supply", value: "2" })] });
    const unknowns = autoUnknowns(b, evaluateEvidence(b, NOW));
    expect(unknowns.filter((u) => u.startsWith("Total supply")).length).toBe(1);
  });

  it("states the source mode from the evidence itself", () => {
    expect(sourceMode(brief())).toMatch(/No live sources were queried/);
    expect(sourceMode(brief({ evidence: [ev({ providerId: "botscan" })] }))).toBe(
      "Generated from configured sources (BOTScan) and local template logic.",
    );
    expect(sourceMode(brief({ evidence: [ev({ providerId: "botscan" }), ev({})] }))).toBe(
      "Generated from configured sources (BOTScan), user-provided inputs and local template logic.",
    );
  });

  it("adds the provider caveat only when provider values are present", () => {
    expect(autoLimitations(brief()).join(" ")).not.toMatch(/as reported at their read time/);
    expect(autoLimitations(brief({ evidence: [ev({ providerId: "botchain-rpc" })] })).join(" ")).toMatch(/as reported at their read time/);
  });

  it("counts filled parts", () => {
    const empty = partsFilled(brief({ question: "" }));
    expect(empty.Question).toBe(false);
    expect(empty.Horizon).toBe(true);
    expect(summary(brief({ evidence: [ev({})], risks: "One pool", rules: [{ id: "r", text: "x", type: "qualitative", requires: [], fromTemplate: false }] })).filledCount).toBe(
      10,
    );
  });
});
