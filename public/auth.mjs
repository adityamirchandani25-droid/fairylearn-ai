// auth.mjs — runs in the browser. It handles accounts (sign up, log in, log out, email
// confirmation links) and keeps the learner's login session fresh.
//
// Background: how Supabase logins work
//   - Logging in returns two tokens. The *access token* proves who you are and is sent with
//     every API request; it expires after about an hour. The *refresh token* is used once to
//     get a new pair of tokens when the access token is about to expire.
//   - Supabase rotates refresh tokens: each one works once. If the same refresh token is used
//     twice (for example by two requests refreshing at the same moment), Supabase assumes it
//     was stolen and ends the session. That is why this module makes sure only one refresh is
//     ever in progress, and why every token request goes through accessToken() below.
//
// The module exports:
//   AuthError  — the error meaning "you must log in again".
//   createAuth — the account object the app uses (accounts.signIn(), accounts.user, ...).
//   createApi  — a fetch helper for this site's own /api/* routes that attaches the token.
//
// Email/password accounts through Supabase Auth's REST API. This module is the only place that
// touches the session, so every request gets a fresh token and only one refresh runs at a time.
// (Supabase revokes a session when the same refresh token is used twice.)
//
// STORAGE_KEY: the localStorage key that holds the session, so it survives reloads and new tabs.
// ALREADY_REGISTERED: shared message for the several ways Supabase reports a taken email.
const STORAGE_KEY = 'fairylearn-session';
const ALREADY_REGISTERED = 'An account with this email already exists. Try logging in instead.';
// Supabase returns machine-readable error codes such as "invalid_credentials". This table turns
// them into friendly messages for students. Codes not listed fall back to Supabase's own message.
const messages = {
  invalid_credentials: 'That email and password don’t match. Please try again.',
  invalid_grant: 'That email and password don’t match. Please try again.',
  email_not_confirmed: 'Please confirm your email first. The link is in your inbox.',
  user_already_exists: ALREADY_REGISTERED,
  email_exists: ALREADY_REGISTERED,
  weak_password: 'Please choose a stronger password with at least 8 characters.',
  email_address_invalid: 'Please enter a valid email address.',
  signup_disabled: 'New accounts are closed right now.',
  over_request_rate_limit: 'Too many attempts. Please wait a minute and try again.',
  over_email_send_rate_limit: 'Too many emails were sent. Please wait a few minutes and try again.'
};

// The app treats AuthError differently from every other error: it clears the learner's local
// state and shows the login form (see handleFailure in app.mjs). Every other error just shows
// a message, and the learner stays logged in.
// Thrown when the learner must log in again; anything else is a temporary problem worth retrying.
export class AuthError extends Error {
  constructor(message = 'Your session expired. Please log in again.') { super(message); this.name = 'AuthError'; }
}

// Creates the account manager.
//   url, anonKey — the Supabase project URL and public anon key, from /api/config.
//   storage      — where the session is saved (localStorage in the browser; tests pass a fake).
//   fetchImpl    — the function used for network requests (tests pass a fake).
//   now          — the clock in milliseconds (tests pass a fixed time).
// Passing these in, instead of using the browser globals directly, is what makes the module
// testable in Node without a browser.
export function createAuth({ url, anonKey, storage = globalThis.localStorage, fetchImpl = (...args) => fetch(...args), now = () => Date.now() }) {
  // `session` is the in-memory copy of the session: { access_token, refresh_token, expires_at, user }.
  // `refreshing` holds the promise of the refresh currently in progress, or null if there is none.
  let session = load();
  let refreshing = null;

  // Reads the saved session. Returns null if nothing is saved, the JSON is corrupted, or a
  // required field is missing, so a damaged entry just means "logged out" instead of a crash.
  function load() {
    try {
      const stored = JSON.parse(storage.getItem(STORAGE_KEY));
      return stored?.access_token && stored.refresh_token && stored.user?.id ? stored : null;
    } catch { return null; }
  }
  // Saves a new session in memory and in storage.
  // expires_at is a Unix time in seconds. Supabase sends either expires_at directly or
  // expires_in (seconds from now); we accept both and assume one hour if neither is present.
  // Writing to storage can fail (private browsing, or a full or disabled storage); the session
  // then still works until the page is closed.
  function save(data) {
    session = { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user,
      expires_at: Number(data.expires_at) || Math.floor(now() / 1000) + (Number(data.expires_in) || 3600) };
    try { storage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* Storage may be disabled; the session lasts for this page. */ }
  }
  // Forgets the session in memory and in storage (used on logout and when a session expires).
  function clear() {
    session = null;
    try { storage.removeItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }
  }

  // Calls a Supabase Auth endpoint (e.g. "signup", "token?grant_type=password", "logout").
  // A request with a body is sent as POST; without one it is a GET. `token` is added as a
  // Bearer header when the endpoint needs to know who is calling.
  // Errors are always thrown as Error objects with a student-friendly message, plus `status`
  // (the HTTP status) so callers can tell "wrong password" (4xx) from "server trouble".
  async function request(path, { body, token } = {}) {
    let response;
    try {
      response = await fetchImpl(`${url}/auth/v1/${path}`, {
        method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(15000),
        headers: { apikey: anonKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
    // fetch() itself rejects only when no response arrived at all: offline, DNS failure or timeout.
    } catch { throw new Error('We couldn’t reach the account service. Check your connection and try again.'); }
    // Supabase normally answers with JSON, but an error page might not be JSON; fall back to {}.
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Newer Supabase versions send `error_code`; older ones send `error` (e.g. "invalid_grant").
      // A 429 means Supabase's own rate limit was hit (too many login attempts from this IP).
      const code = data.error_code || data.error;
      const error = new Error(messages[code] || (response.status === 429 ? messages.over_request_rate_limit : data.msg || data.error_description || 'We couldn’t complete that request. Please try again.'));
      error.status = response.status;
      throw error;
    }
    return data;
  }

  // Exchanges the refresh token for a fresh pair of tokens. `current` is the session we started
  // with, so we can tell whether something changed while we were waiting for Supabase.
  async function refresh(current) {
    try {
      const data = await request('token?grant_type=refresh_token', { body: { refresh_token: current.refresh_token } });
      if (!session) throw new AuthError(); // Logged out while the refresh was running.
      // Only save if the session is still the one we refreshed. If another tab refreshed first and
      // accessToken() already picked up its newer tokens, keep those instead of overwriting them.
      if (session.refresh_token === current.refresh_token) save(data);
      return session.access_token;
    // A 4xx answer (except 429) means the refresh token is no longer valid: revoked, expired, or
    // already used. The learner has to log in again, so clear everything and throw AuthError.
    // Network errors and 5xx answers are temporary: keep the session and let the caller show a
    // "try again" message, so a brief outage never logs anyone out.
    } catch (error) {
      if (error instanceof AuthError || (error.status >= 400 && error.status < 500 && error.status !== 429)) { clear(); throw new AuthError(); }
      throw error;
    }
  }

  // The public account API used by app.mjs.
  return {
    // The logged-in Supabase user ({ id, email, user_metadata: { name } }), or null when logged out.
    get user() { return session?.user || null; },

    // Creates an account. `name` is stored in user_metadata, so the dashboard can greet the
    // learner. `redirectTo` is where the confirmation email link should return to (this site's
    // origin); Supabase only honors it if the address is in the project's allowed redirect URLs.
    // Returns { needsConfirmation: true } when the learner must click the email link first.
    // Supabase only sends tokens right away when email confirmation is turned off.
    async signUp({ name, email, password, redirectTo }) {
      const query = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : '';
      const data = await request(`signup${query}`, { body: { email, password, data: { name } } });
      if (data.access_token) { save(data); return { needsConfirmation: false }; }
      // Supabase does not report "email already registered" when confirmations are on, so that
      // nobody can discover who has an account. The tell-tale sign is an empty identities list.
      // With email confirmation on, Supabase answers an existing address with a user that has no identities.
      const identities = data.identities ?? data.user?.identities;
      if (Array.isArray(identities) && !identities.length) throw new Error(ALREADY_REGISTERED);
      return { needsConfirmation: true };
    },

    // Logs in with email and password and saves the session. Wrong details throw a friendly error.
    async signIn({ email, password }) {
      save(await request('token?grant_type=password', { body: { email, password } }));
    },

    // Logs out. The local session is cleared first, so the learner is logged out immediately even
    // if the network request fails; the request then tells Supabase to revoke the tokens.
    async signOut() {
      const token = session?.access_token;
      clear();
      if (token) await request('logout', { body: {}, token }).catch(() => {});
    },

    // After clicking the confirmation email, Supabase redirects back to the site with values in the
    // URL fragment (the part after #), e.g.
    //   #access_token=...&refresh_token=...&expires_in=3600&type=signup
    // or, when the link is bad or expired,
    //   #error=access_denied&error_code=otp_expired&error_description=...
    // Returns true when it logged the learner in, false when the fragment has no tokens (such as
    // the #how-it-works anchor), and throws a friendly error for a bad or expired link.
    // We fetch the user with the new token to learn their id and name before saving the session.
    // Email confirmation links return to the site with the session (or an error) in the URL fragment.
    async completeRedirect(hash) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      if (params.has('error') || params.has('error_description')) {
        throw new Error(params.get('error_code') === 'otp_expired' ? 'That confirmation link has expired. Please log in to get a new one.' : params.get('error_description') || 'That link didn’t work. Please log in.');
      }
      const accessToken = params.get('access_token');
      if (!accessToken) return false;
      const user = await request('user', { token: accessToken });
      save({ access_token: accessToken, refresh_token: params.get('refresh_token'), expires_at: params.get('expires_at'), expires_in: params.get('expires_in'), user });
      return true;
    },

    // Returns a valid access token, refreshing it first when needed. Every API call goes through here.
    //   forceRefresh — refresh even if the token looks valid (used when the server rejected it).
    // Steps:
    //   1. Re-read storage, because another tab may have refreshed (newer tokens) or logged out.
    //   2. No session → AuthError ("Please log in to continue.").
    //   3. Token valid for more than 60 more seconds → return it right away.
    //   4. Otherwise refresh. If a refresh is already running, wait for that same one instead of
    //      starting a second (the `||=` only starts a refresh when `refreshing` is null). This is
    //      what prevents the double-use of a refresh token described at the top of this file.
    async accessToken({ forceRefresh = false } = {}) {
      // Another tab may have refreshed or logged out; always start from the stored session.
      // Use the stored copy only if it belongs to the same user. If storage is now empty, another
      // tab logged out, so this tab logs out too.
      const stored = load();
      if (session && stored?.user.id === session.user.id) session = stored;
      else if (session && !stored) clear();
      if (!session) throw new AuthError('Please log in to continue.');
      if (!forceRefresh && session.expires_at - 60 > now() / 1000) return session.access_token;
      refreshing ||= refresh(session).finally(() => { refreshing = null; });
      return refreshing;
    },

    // Exposed so createApi can log the learner out locally when the server keeps rejecting them.
    clear
  };
}

// Creates `api(path, body)`, the helper app.mjs uses for every request to this site's server.
//   - With a body it sends POST JSON; without one it sends GET.
//   - It always attaches a current access token from auth.accessToken().
//   - If the server answers 401 (token rejected), it forces a token refresh and retries the
//     request once. If it is rejected again, the session really is invalid: it logs out
//     locally and throws AuthError so the app shows the login form.
//   - Other errors throw an Error with the server's own message (e.g. a rate-limit message).
//   - Network failures and timeouts become friendly messages.
// The 90-second timeout is longer than the server's 45-second AI timeout, so slow AI answers
// are reported by the server rather than cut off by the browser.
// Calls this site's API with the learner's token, retrying once with a refreshed token on a 401.
export function createApi(auth, fetchImpl = (...args) => fetch(...args)) {
  return async function api(path, body, retried = false) {
    const token = await auth.accessToken({ forceRefresh: retried });
    let response;
    try {
      response = await fetchImpl(path, {
        method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(90000),
        headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
    } catch (error) {
      throw new Error(error?.name === 'TimeoutError' ? 'That took longer than expected. Please try again.' : 'We couldn’t reach Fairylearn. Check your connection and try again.');
    }
    // Server responses are JSON. If something in between returned an HTML error page, parse fails
    // and we use {} so the generic message below is shown instead of a JSON syntax error.
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      if (!retried) return api(path, body, true);
      auth.clear();
      throw new AuthError(data.error);
    }
    if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  };
}
