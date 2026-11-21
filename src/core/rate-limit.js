export function createRateLimiter({ windowMs = 5000, max = 4, now = () => Date.now() } = {}) {
  const hits = new Map();
  return {
    allow(key) {
      const current = now();
      const recent = (hits.get(key) || []).filter(t => current - t < windowMs);
      if (recent.length >= max) { hits.set(key, recent); return false; }
      recent.push(current);
      hits.set(key, recent);
      if (hits.size > 5000) for (const [k, v] of hits) if (v.every(t => current - t >= windowMs)) hits.delete(k);
      return true;
    }
  };
}
