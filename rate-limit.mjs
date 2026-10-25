// rate-limit.mjs — counts requests so one visitor or account cannot overload the site or
// spend unlimited money on AI calls.
//
// How a "fixed window" works: the first request for a key (an IP address or user id) opens a
// window lasting `windowMs`. Each request in that window adds 1 to the count. Once the count
// reaches `limit`, further requests are refused until the window ends; the next request after
// that opens a fresh window with the count back at zero.
//
// Example with limit 3 and a one-minute window:
//   12:00:00 request 1 → allowed (window opened, ends 12:01:00)
//   12:00:10 request 2 → allowed
//   12:00:20 request 3 → allowed
//   12:00:30 request 4 → refused, retryAfter = 30 seconds
//   12:01:05 request 5 → allowed (new window)
//
// The counts live in memory, so they reset when the server restarts.
//
// Fixed-window limiter kept in memory. It suits a single server process; run a shared
// store such as Redis instead if the site is ever scaled to several processes.
//
// Creates one independent limiter.
//   limit    — how many requests are allowed per window.
//   windowMs — window length in milliseconds (60 * 1000 = one minute).
//   maxKeys  — safety cap on how many keys are remembered. Without it, an attacker sending
//              requests from millions of different addresses could make the Map grow
//              until the server ran out of memory.
export function createRateLimiter({ limit, windowMs, maxKeys = 10000 }) {
  // windows maps each key to { count, resetAt }, where resetAt is the time (in ms) the window ends.
  const windows = new Map();
  // Frees memory when the Map is full: first drop every expired window. If it is still full
  // (many keys are active at once), drop the oldest entries; a Map iterates in insertion
  // order, so keys().next() is always the oldest key.
  function prune(now) {
    for (const [key, entry] of windows) if (entry.resetAt <= now) windows.delete(key);
    while (windows.size >= maxKeys) windows.delete(windows.keys().next().value);
  }
  return {
    // Records one request for `key` and reports whether it may go ahead.
    // Returns { allowed: true, retryAfter: 0 } or { allowed: false, retryAfter: <seconds> },
    // where retryAfter is how long until the current window ends.
    // `now` can be passed in by tests to simulate time; normally it is the current time.
    take(key, now = Date.now()) {
      let entry = windows.get(key);
      // No window yet, or the old one has ended: start a new window with a count of zero.
      if (!entry || entry.resetAt <= now) {
        if (windows.size >= maxKeys) prune(now);
        entry = { count: 0, resetAt: now + windowMs };
        windows.set(key, entry);
      }
      // Over the limit: refuse. The count is not increased, so refused requests do not extend the wait.
      if (entry.count >= limit) return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
      entry.count++;
      return { allowed: true, retryAfter: 0 };
    },
    // Forgets every key. Used by the tests to start each test with fresh limits.
    reset() { windows.clear(); }
  };
}
