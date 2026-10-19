// Briefs are stored in this browser only (localStorage). Every access is guarded:
// storage can be blocked or cleared, and the app must still work for one session.

import { SCHEMA_ID, type Brief } from "./schema";

const KEY = "loxen.briefs.v1";

function readAll(): Brief[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((b) => b && b.schema === SCHEMA_ID) : [];
  } catch {
    return [];
  }
}

function writeAll(briefs: Brief[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(briefs));
    return true;
  } catch {
    return false;
  }
}

export function listBriefs(): Brief[] {
  return readAll().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getBrief(id: string): Brief | null {
  return readAll().find((b) => b.id === id) ?? null;
}

export function saveBrief(brief: Brief): boolean {
  const all = readAll().filter((b) => b.id !== brief.id);
  return writeAll([brief, ...all]);
}

export function deleteBrief(id: string): boolean {
  return writeAll(readAll().filter((b) => b.id !== id));
}

export function newId(prefix = "b"): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return prefix + "_" + Array.from(bytes, (x) => x.toString(36).padStart(2, "0")).join("").slice(0, 10);
}
