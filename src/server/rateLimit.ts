// A small fixed-window limiter per client key, held in this process's memory. Enough to stop one
// visitor hammering the upstream explorer from a single server; a multi-instance deployment needs a
// shared store instead (noted in the README).

export function createLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { start: number; count: number }>();
  return function allow(key: string, now = Date.now()): { ok: boolean; retryAfterS: number } {
    const w = hits.get(key);
    if (!w || now - w.start >= windowMs) {
      hits.set(key, { start: now, count: 1 });
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (now - v.start >= windowMs) hits.delete(k);
      }
      return { ok: true, retryAfterS: 0 };
    }
    if (w.count >= limit) return { ok: false, retryAfterS: Math.ceil((w.start + windowMs - now) / 1000) };
    w.count += 1;
    return { ok: true, retryAfterS: 0 };
  };
}
