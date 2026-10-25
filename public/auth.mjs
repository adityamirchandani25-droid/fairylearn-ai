// Email/password accounts through Supabase Auth's REST API. This module is the only place that
// touches the session, so every request gets a fresh token and only one refresh runs at a time.
// (Supabase revokes a session when the same refresh token is used twice.)
const STORAGE_KEY = 'fairylearn-session';
const ALREADY_REGISTERED = 'An account with this email already exists. Try logging in instead.';
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

// Thrown when the learner must log in again; anything else is a temporary problem worth retrying.
export class AuthError extends Error {
  constructor(message = 'Your session expired. Please log in again.') { super(message); this.name = 'AuthError'; }
}

export function createAuth({ url, anonKey, storage = globalThis.localStorage, fetchImpl = (...args) => fetch(...args), now = () => Date.now() }) {
  let session = load();
  let refreshing = null;

  function load() {
    try {
      const stored = JSON.parse(storage.getItem(STORAGE_KEY));
      return stored?.access_token && stored.refresh_token && stored.user?.id ? stored : null;
    } catch { return null; }
  }
  function save(data) {
    session = { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user,
      expires_at: Number(data.expires_at) || Math.floor(now() / 1000) + (Number(data.expires_in) || 3600) };
    try { storage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch { /* Storage may be disabled; the session lasts for this page. */ }
  }
  function clear() {
    session = null;
    try { storage.removeItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }
  }

  async function request(path, { body, token } = {}) {
    let response;
    try {
      response = await fetchImpl(`${url}/auth/v1/${path}`, {
        method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(15000),
        headers: { apikey: anonKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
    } catch { throw new Error('We couldn’t reach the account service. Check your connection and try again.'); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = data.error_code || data.error;
      const error = new Error(messages[code] || (response.status === 429 ? messages.over_request_rate_limit : data.msg || data.error_description || 'We couldn’t complete that request. Please try again.'));
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function refresh(current) {
    try {
      const data = await request('token?grant_type=refresh_token', { body: { refresh_token: current.refresh_token } });
      if (!session) throw new AuthError(); // Logged out while the refresh was running.
      if (session.refresh_token === current.refresh_token) save(data);
      return session.access_token;
    } catch (error) {
      if (error instanceof AuthError || (error.status >= 400 && error.status < 500 && error.status !== 429)) { clear(); throw new AuthError(); }
      throw error;
    }
  }

  return {
    get user() { return session?.user || null; },

    async signUp({ name, email, password, redirectTo }) {
      const query = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : '';
      const data = await request(`signup${query}`, { body: { email, password, data: { name } } });
      if (data.access_token) { save(data); return { needsConfirmation: false }; }
      // With email confirmation on, Supabase answers an existing address with a user that has no identities.
      const identities = data.identities ?? data.user?.identities;
      if (Array.isArray(identities) && !identities.length) throw new Error(ALREADY_REGISTERED);
      return { needsConfirmation: true };
    },

    async signIn({ email, password }) {
      save(await request('token?grant_type=password', { body: { email, password } }));
    },

    async signOut() {
      const token = session?.access_token;
      clear();
      if (token) await request('logout', { body: {}, token }).catch(() => {});
    },

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

    async accessToken({ forceRefresh = false } = {}) {
      // Another tab may have refreshed or logged out; always start from the stored session.
      const stored = load();
      if (session && stored?.user.id === session.user.id) session = stored;
      else if (session && !stored) clear();
      if (!session) throw new AuthError('Please log in to continue.');
      if (!forceRefresh && session.expires_at - 60 > now() / 1000) return session.access_token;
      refreshing ||= refresh(session).finally(() => { refreshing = null; });
      return refreshing;
    },

    clear
  };
}

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
