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

test('logging in stores the session so it survives a reload', async () => {
  const { auth, storage } = setup(() => reply(tokens(1)));
  await auth.signIn({ email: 'sam@example.com', password: 'password123' });
  assert.equal(auth.user.id, 'user-1');
  assert.equal(await auth.accessToken(), 'access-1');
  const reloaded = createAuth({ url: 'https://auth.example.invalid', anonKey: 'anon', storage, fetchImpl: async () => assert.fail('no request needed'), now: () => 1_000_000_000_000 });
  assert.equal(reloaded.user.id, 'user-1');
});

test('Supabase error codes become friendly messages', async () => {
  const { auth } = setup(() => reply({ error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400));
  await assert.rejects(auth.signIn({ email: 'sam@example.com', password: 'wrong-password' }), /don’t match/);
  const limited = setup(() => reply({}, 429));
  await assert.rejects(limited.auth.signIn({ email: 'sam@example.com', password: 'password123' }), /Too many attempts/);
  const offline = setup(() => { throw new TypeError('fetch failed'); });
  await assert.rejects(offline.auth.signIn({ email: 'sam@example.com', password: 'password123' }), /couldn’t reach/);
});

test('signing up with an existing email explains what to do', async () => {
  const { auth } = setup(() => reply({ id: 'obfuscated', identities: [] }));
  await assert.rejects(auth.signUp({ name: 'Sam', email: 'sam@example.com', password: 'password123' }), /already exists/);
  const fresh = setup(() => reply({ id: 'new-user', identities: [{ id: 'identity' }] }));
  assert.deepEqual(await fresh.auth.signUp({ name: 'Sam', email: 'new@example.com', password: 'password123', redirectTo: 'http://localhost:3000' }), { needsConfirmation: true });
  assert.match(fresh.calls[0].url, /signup\?redirect_to=http%3A%2F%2Flocalhost%3A3000/);
});

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

test('confirmation links sign the learner in, and expired links explain themselves', async () => {
  const { auth } = setup(url => url.endsWith('/user') ? reply(user) : assert.fail());
  assert.equal(await auth.completeRedirect('#access_token=a&refresh_token=r&expires_in=3600&type=signup'), true);
  assert.equal(auth.user.id, 'user-1');
  await assert.rejects(auth.completeRedirect('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid'), /expired/);
  assert.equal(await auth.completeRedirect('#how-it-works'), false);
});

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

test('the API helper surfaces server messages and connection problems', async () => {
  const { auth } = setup(() => reply(tokens(1)));
  await auth.signIn({ email: 'sam@example.com', password: 'password123' });
  await assert.rejects(createApi(auth, async () => reply({ error: 'Your guide needs a little break.' }, 429))('/api/guide', {}), /little break/);
  await assert.rejects(createApi(auth, async () => { throw new TypeError('fetch failed'); })('/api/guide', {}), /couldn’t reach Fairylearn/);
  await assert.rejects(createApi(auth, async () => ({ ok: false, status: 502, json: async () => { throw new SyntaxError('HTML'); } }))('/api/guide', {}), /Something went wrong/);
});
