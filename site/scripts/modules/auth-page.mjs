// auth-page.mjs — runs on /login and /signup. It uses the app's own account module
// (public/auth.mjs) exactly as public/app.mjs does, then sends the learner on to /app, which
// picks up the saved session. Email confirmation links return to "/" and are forwarded to
// /app by the layout, so that flow is not handled here.
import { createAuth } from '/auth.mjs';

const root = document.querySelector('[data-auth]');
const mode = root?.dataset.auth;
const form = root?.querySelector('[data-auth-form]');
const fieldset = root?.querySelector('[data-auth-fields]');
const submit = root?.querySelector('[data-auth-submit]');
const errorLine = root?.querySelector('[data-auth-error]');
const notice = root?.querySelector('[data-auth-notice]');
const label = submit?.querySelector('span');
const idleLabel = label?.textContent;

const show = (selector, visible) => { const el = root.querySelector(selector); if (el) el.hidden = !visible; };

// Show or hide the password. The button text says what pressing it will do.
const reveal = root?.querySelector('[data-auth-reveal]');
reveal?.addEventListener('click', () => {
  const input = root.querySelector('#field-password');
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  reveal.textContent = visible ? 'Hide' : 'Show';
  reveal.setAttribute('aria-pressed', String(visible));
});

// Friendly messages instead of the browser's own validation bubbles.
const problem = input => {
  const v = input.validity;
  if (input.name === 'name' && v.valueMissing) return 'Tell us what to call you.';
  if (input.name === 'email' && v.valueMissing) return 'Enter your email address.';
  if (input.name === 'email' && v.typeMismatch) return 'That email address doesn’t look quite right.';
  if (input.name === 'password' && v.valueMissing) return 'Enter your password.';
  if (input.name === 'password' && v.tooShort) return 'Your password needs at least 8 characters.';
  return input.validationMessage;
};
const setError = (message, input) => {
  errorLine.textContent = message;
  form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  if (input) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-errormessage', errorLine.id); input.focus(); }
};
if (errorLine) errorLine.id = 'auth-error';
form?.addEventListener('input', event => {
  if (event.target.getAttribute('aria-invalid') === 'true' && event.target.checkValidity()) setError('');
});

if (root && form) {
  const config = await fetch('/api/config').then(r => r.ok ? r.json() : {}).catch(() => ({}));
  const configured = !!(config.supabaseUrl && config.supabaseAnonKey);
  let accounts = null;

  if (!configured) {
    // Accounts are switched off on this server (or it can't be reached). Say so plainly and
    // leave the form visible but inactive; every lesson still works without an account.
    root.querySelector('[data-auth-notice-text]').textContent = 'Sign-in isn’t available right now. You can still explore every free lesson and quiz without an account.';
    notice.hidden = false;
    fieldset.disabled = true;
    form.classList.add('is-unavailable');
  } else {
    accounts = createAuth({ url: config.supabaseUrl, anonKey: config.supabaseAnonKey });
    if (accounts.user) {
      form.hidden = true;
      show('[data-auth-intro]', false);
      show('[data-auth-more]', false);
      show('[data-auth-signed-in]', true);
    }
  }

  let busy = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !accounts) return;
    const invalid = [...form.querySelectorAll('input')].find(input => !input.checkValidity());
    if (invalid) return setError(problem(invalid), invalid);
    setError('');
    const fields = new FormData(form);
    const email = String(fields.get('email')).trim();
    const password = String(fields.get('password'));
    busy = true; submit.disabled = true; form.setAttribute('aria-busy', 'true'); label.textContent = 'One little moment…';
    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await accounts.signUp({ name: String(fields.get('name')).trim(), email, password, redirectTo: location.origin });
        if (needsConfirmation) {
          form.reset();
          form.hidden = true;
          show('[data-auth-intro]', false);
          show('[data-auth-more]', false);
          root.querySelector('[data-auth-email]').textContent = email;
          show('[data-auth-inbox]', true);
          root.querySelector('[data-auth-inbox]').focus();
          return;
        }
      } else {
        await accounts.signIn({ email, password });
      }
      location.href = '/app';
    } catch (error) {
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      busy = false; submit.disabled = false; form.removeAttribute('aria-busy'); label.textContent = idleLabel;
    }
  });
}
