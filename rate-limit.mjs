// Fixed-window limiter kept in memory. It suits a single server process; run a shared
// store such as Redis instead if the site is ever scaled to several processes.
export function createRateLimiter({ limit, windowMs, maxKeys = 10000 }) {
  const windows = new Map();
  function prune(now) {
    for (const [key, entry] of windows) if (entry.resetAt <= now) windows.delete(key);
    while (windows.size >= maxKeys) windows.delete(windows.keys().next().value);
  }
  return {
    take(key, now = Date.now()) {
      let entry = windows.get(key);
      if (!entry || entry.resetAt <= now) {
        if (windows.size >= maxKeys) prune(now);
        entry = { count: 0, resetAt: now + windowMs };
        windows.set(key, entry);
      }
      if (entry.count >= limit) return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
      entry.count++;
      return { allowed: true, retryAfter: 0 };
    },
    reset() { windows.clear(); }
  };
}
