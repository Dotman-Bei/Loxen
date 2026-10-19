import { describe, expect, it } from "vitest";
import { canonical, committable, digestOf, newSalt, shortHex } from "./digest";
import { SCHEMA_ID, type Brief } from "./schema";

describe("canonical serialization", () => {
  it("sorts keys at every depth and drops undefined", () => {
    expect(canonical({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: undefined } })).toBe('{"a":{"d":[3,{"y":2,"z":1}]},"b":1}');
  });
  it("is stable however the object was built", () => {
    expect(canonical({ x: 1, y: 2 })).toBe(canonical({ y: 2, x: 1 }));
  });
});

describe("digest", () => {
  const salt = "0x" + "11".repeat(32);
  const brief = { question: "Is the pool deep enough?" };

  it("is deterministic for the same inputs", () => {
    expect(digestOf({ brief, salt })).toBe(digestOf({ brief, salt }));
  });
  it("changes completely with a new salt", () => {
    const a = digestOf({ brief, salt });
    const b = digestOf({ brief, salt: "0x" + "22".repeat(32) });
    expect(a).not.toBe(b);
    expect(a).toMatch(/^0x[0-9a-f]{64}$/);
  });
  it("binds the owner and chain", () => {
    const owner = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
    expect(digestOf({ brief, salt, owner })).not.toBe(digestOf({ brief, salt }));
    expect(digestOf({ brief, salt, owner, chainId: 677 })).not.toBe(digestOf({ brief, salt, owner, chainId: 968 }));
  });
  it("ignores the letter case of the owner address", () => {
    const owner = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
    expect(digestOf({ brief, salt, owner })).toBe(digestOf({ brief, salt, owner: owner.toLowerCase() }));
  });
  it("matches a fixed vector computed independently, so the scheme cannot drift silently", () => {
    // keccak256 of the canonical envelope, computed outside Loxen with Foundry:
    // cast keccak '{"brief":{"question":"Is the pool deep enough?"},"chainId":968,"domain":"loxen.research-receipt",
    //   "owner":"0x0000000000000000000000000000000000000001","salt":"0x1111…1111","schema":"loxen.brief/1"}'
    // Changing this breaks verification of every receipt already on-chain.
    expect(digestOf({ brief, salt, owner: "0x0000000000000000000000000000000000000001", chainId: 968 })).toBe(
      "0x78589b488b67a7fb330ccf32509d41867da1a9a01a8f8274d82a6dfb628ab33d",
    );
  });
});

describe("what is committed", () => {
  const b: Brief = {
    id: "b",
    schema: SCHEMA_ID,
    question: "q",
    asset: { query: "", network: "bohr", contract: "" },
    horizon: "weeks",
    lens: "liquidity",
    evidence: [],
    rules: [],
    risks: "",
    unknowns: "",
    limitations: "",
    privateNotes: "my sizing",
    createdAt: "t",
    updatedAt: "t",
    receipt: { receiptId: "1", digest: "0x", owner: "0x", chainId: 968, txHash: "0x", blockNumber: 1, blockTime: "t" },
  };
  it("leaves private notes and the receipt out by default", () => {
    const c = committable(b, false) as Record<string, unknown>;
    expect(c.privateNotes).toBeUndefined();
    expect(c.receipt).toBeUndefined();
  });
  it("includes private notes only on opt-in", () => {
    expect((committable(b, true) as Record<string, unknown>).privateNotes).toBe("my sizing");
  });
});

describe("helpers", () => {
  it("makes 32-byte random salts", () => {
    const a = newSalt();
    expect(a).toMatch(/^0x[0-9a-f]{64}$/);
    expect(newSalt()).not.toBe(a);
  });
  it("shortens long hex only", () => {
    expect(shortHex("0x1234567890abcdef")).toBe("0x1234…cdef");
    expect(shortHex("0x12")).toBe("0x12");
  });
});
