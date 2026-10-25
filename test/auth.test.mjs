// Tests for public/auth.mjs. These run in Node, not a browser, so the browser pieces are faked:
//   memoryStorage() — a stand-in for localStorage that keeps values in a Map;
//   reply()         — a fake fetch Response;
//   tokens(n)       — a fake Supabase session numbered n (access-n / refresh-n);
//   setup(handler)  — creates an auth manager whose network requests go to `handler`, records
//                     every request in `calls`, and uses a fixed clock so expiry is predictable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuth, createApi, AuthError } from '../public/auth.mjs';

const memoryStorage = () => {
  const items = new Map();
  return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, String(value)), removeItem: key => items.delete(key) };
};
const reply = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const user = { id: 'user-1', user_metadata: { name: 'Sam' } };
const tokens = (n, expiresIn = 3600) => ({ access_token: `access-${n}`, refresh_token: `refresh-${n}`, expires_in: expiresIn, user });

function setup(handler, { now = 1_000_000_000_000 } = {}) {
  const calls = [];
  const storage = memoryStorage();
  const fetchImpl = async (url, options) => { calls.push({ url, body: options.body && JSON.parse(options.body) }); return handler(url, options, calls); };
  const auth = createAuth({ url: 'https://auth.example.invalid', anonKey: 'anon', storage, fetchImpl, now: () => now });
  return { auth, calls, storage };
}

// A saved session is reused after a page reload, without asking Supabase again.
test('logging in stores the session so it survives a reload', async () => {
  const { auth, storage } = setup(() => reply(tokens(1)));
  await auth.signIn({ email: 'sam@example.com', password: 'password123' });
  assert.equal(auth.user.id, 'user-1');
  assert.equal(await auth.accessToken(), 'access-1');
  const reloaded = createAuth({ url: 'https://auth.example.invalid', anonKey: 'anon', storage, fetchImpl: async () => assert.fail('no request needed'), now: () => 1_000_000_000_000 });
  assert.equal(reloaded.user.id, 'user-1');
});

// Wrong passwords, Supabase rate limits and lost connections all produce friendly messages.
test('Supabase error codes become friendly messages', async () => {
  const { auth } = setup(() => reply({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400));
  await assert.rejects(auth.signIn({ email: 'sam@example.com', password: 'wrong-password' }), /don’t match/);
  const limited = setup(() => reply({}, 429));
  await assert.rejects(limited.auth.signIn({ email: 'sam@example.com', password: 'password123' }), /Too many attempts/);
  const offline = setup(() => { throw new TypeError('fetch failed'); });
  await assert.rejects(offline.auth.signIn({ email: 'sam@example.com', password: 'password123' }), /couldn’t reach/);
});

// Supabase hides already-registered emails; the module still explains what to do. A new
// account asks for email confirmation, and the redirect address is sent along.
test('signing up with an existing email explains what to do', async () => {
  const { auth } = setup(() => reply({ id: 'obfuscated', identities: [] }));
  await assert.rejects(auth.signUp({ name: 'Sam', email: 'sam@example.com', password: 'password123' }), /already exists/);
  const fresh = setup(() => reply({ id: 'new-user', identities: [{ id: 'identity' }] }));
  assert.deepEqual(await fresh.auth.signUp({ name: 'Sam', email: 'new@example.com', password: 'password123', redirectTo: 'http://localhost:3000' }), { needsConfirmation: true });
  assert.match(fresh.calls[0].url, /signup\?redirect_to=http%3A%2F%2Flocalhost%3A3000/);
});

// The most important auth test: three requests needing a fresh token at the same moment must
// share ONE refresh. Two refreshes with the same refresh token would make Supabase end the session.
test('simultaneous requests share one token refresh', async () => {
  let refreshes = 0;
  const { auth } = setup(async (url, _options, calls) => {
    if (url.includes('grant_type=password')) return reply(tokens(1, 30));
    refreshes++;
    assert.equal(calls.at(-1).body.refresh_token, 'refresh-1');
    await new Promise(resolve => setTimeout(resolve, 5));
    return reply(tokens(2));
  });
  await auth.signIn({ email: 'sam@example.com', password: 'password123' });
  const results = await Promise.all([auth.accessToken(), auth.accessToken(), auth.accessToken()]);
  assert.deepEqual(results, ['access-2', 'access-2', 'access-2']);
  assert.equal(refreshes, 1);
});

// A network blip during refresh keeps the learner logged in; a rejected refresh token logs them out.
test('a rejected refresh token signs the learner out, but a network blip does not', async () => {
  let refreshStatus = 0;
  const { auth } = setup(url => {
    if (url.includes('grant_type=password')) return reply(tokens(1, 30));
    if (refreshStatus === 0) throw new TypeError('fetch failed');
    return reply({ error_code: 'refresh_token_not_found' }, refreshStatus);
  });
  await auth.signIn({ email: 'sam@example.com', password: 'password123' });
  await assert.rejects(auth.accessToken(), error => !(error instanceof AuthError));
  assert.equal(auth.user.id, 'user-1');
  refreshStatus = 400;
  await assert.rejects(auth.accessToken(), AuthError);
  assert.equal(auth.user, null);
});

// Email confirmation links log the learner in; expired links give a clear message; ordinary
// page anchors such as #how-it-works are ignored.
test('confirmation links sign the learner in, and expired links explain themselves', async () => {
  const { auth } = setup(url => url.endsWith('/user') ? reply(user) : assert.fail());
  assert.equal(await auth.completeRedirect('#access_token=a&refresh_token=r&expires_in=3600&type=signup'), true);
  assert.equal(auth.user.id, 'user-1');
  await assert.rejects(auth.completeRedirect('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid'), /expired/);
  assert.equal(await auth.completeRedirect('#how-it-works'), false);
});

// api() retries once with a refreshed token after a 401, and logs out when the retry fails too.
test('the API helper retries once with a fresh token after a 401', async () => {
  const { auth } = setup(url => url.includes('grant_type=password') ? reply(tokens(1)) : reply(tokens(2)));
  await auth.signIn({ email: 'sam@example.com', password: 'password123' });
  const seen = [];
  const api = createApi(auth, async (path, options) => {
    seen.push(options.headers.Authorization);
    return seen.length === 1 ? reply({ error: 'expired' }, 401) : reply({ ok: true });
  });
  assert.deepEqual(await api('/api/profile'), { ok: true });
  assert.deepEqual(seen, ['Bearer access-1', 'Bearer access-2']);

  const rejecting = createApi(auth, async () => reply({ error: 'Your session expired. Please log in again.' }, 401));
  await assert.rejects(rejecting('/api/profile'), AuthError);
  assert.equal(auth.user, null);
});

// Server error messages are passed through, and connection problems or non-JSON error pages
// become friendly messages.
test('the API helper surfaces server messages and connection problems', async () => {
  const { auth } = setup(() => reply(tokens(1)));
  await auth.signIn({ email: 'sam@example.com', password: 'password123' });
  await assert.rejects(createApi(auth, async () => reply({ error: 'Your guide needs a little break.' }, 429))('/api/guide', {}), /little break/);
  await assert.rejects(createApi(auth, async () => { throw new TypeError('fetch failed'); })('/api/guide', {}), /couldn’t reach Fairylearn/);
  await assert.rejects(createApi(auth, async () => ({ ok: false, status: 502, json: async () => { throw new SyntaxError('HTML'); } }))('/api/guide', {}), /Something went wrong/);
});
