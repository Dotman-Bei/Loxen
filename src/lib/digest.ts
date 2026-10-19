// Receipt digest: keccak256 over a canonical JSON envelope that binds the brief,
// a random salt, the schema and the owner/domain context. The salt never goes on-chain.

import { keccak256, toBytes, bytesToHex } from "viem";
import { SCHEMA_ID, type Brief } from "./schema";

export function newSalt(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/** Stable serialization: object keys sorted, no whitespace. */
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export type DigestInput = {
  brief: unknown;
  salt: string;
  owner?: string;
  chainId?: number;
};

export function digestOf({ brief, salt, owner = ZERO_ADDRESS, chainId = 968 }: DigestInput): `0x${string}` {
  const envelope = {
    domain: "loxen.research-receipt",
    schema: SCHEMA_ID,
    chainId,
    owner: owner.toLowerCase(),
    salt,
    brief,
  };
  return keccak256(toBytes(canonical(envelope)));
}

/** The brief as committed: receipt fields and, unless opted in, private notes are left out. */
export function committable(brief: Brief, includePrivateNotes: boolean) {
  const { receipt: _receipt, privateNotes, ...rest } = brief;
  void _receipt;
  return includePrivateNotes ? { ...rest, privateNotes } : rest;
}

export function shortHex(hex: string, head = 6, tail = 4) {
  if (!hex) return "";
  return hex.length <= head + tail + 1 ? hex : `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}
