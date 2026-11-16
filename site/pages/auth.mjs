// auth.mjs — /login and /signup. The forms call the app's own account module (public/auth.mjs)
// through site/scripts/modules/auth-page.mjs; after signing in, learners continue at /app.
import { button, field, chipGlass, icon } from '../lib/components.mjs';
import { images, picture, SITE } from '../lib/site.mjs';

// The password field has a show/hide toggle, so it is built here rather than with field().
// The label and input keep the shared .field classes.
const passwordField = ({ placeholder, autocomplete, hint = '' }) => `<div class="field">
  <label class="field-label" for="field-password">Password</label>
  <div class="auth-pass">
    <input class="input" id="field-password" name="password" type="password" placeholder="${placeholder}" autocomplete="${autocomplete}" required minlength="8" maxlength="128"${hint ? ' aria-describedby="field-password-hint"' : ''}>
    <button class="auth-reveal" type="button" data-auth-reveal aria-controls="field-password" aria-pressed="false">Show</button>
  </div>${hint ? `
  <span class="field-hint" id="field-password-hint">${hint}</span>` : ''}
</div>`;

function authPage(mode) {
  const signup = mode === 'signup';
  const fields = signup
    ? [
        field({ label: 'Your name', name: 'name', placeholder: 'What should we call you?', autocomplete: 'given-name', maxlength: 60 }),
        field({ label: 'Email address', name: 'email', type: 'email', placeholder: 'you@example.com', autocomplete: 'email' }),
        passwordField({ placeholder: 'Create a password', autocomplete: 'new-password', hint: 'At least 8 characters.' })
      ]
    : [
        field({ label: 'Email address', name: 'email', type: 'email', placeholder: 'you@example.com', autocomplete: 'email' }),
        passwordField({ placeholder: 'Enter your password', autocomplete: 'current-password' })
      ];

  const body = `<section class="auth" data-auth="${mode}">
  <div class="auth-art">
    ${picture(images.heroTall, { loading: 'eager', fetchpriority: 'high', sizes: '(max-width: 1023px) 100vw, 50vw' })}
    <div class="auth-art-copy">
      ${chipGlass(signup ? 'Free to start' : 'Your path is waiting')}
      <p>A small start. <br>Endless possibility.</p>
    </div>
  </div>
  <div class="auth-main">
    <div class="auth-column">
      <div class="auth-intro" data-auth-intro>
        <h1 class="t-heading-lg">${signup ? 'Let’s begin your story.' : 'Welcome back, curious mind.'}</h1>
        <p class="auth-lead">${signup ? 'Create your free account, then answer five quick questions to find your path.' : 'Your next little discovery is waiting.'}</p>
      </div>
      <form class="auth-form" data-auth-form novalidate>
        <fieldset class="auth-fields" data-auth-fields>
          <legend class="sr-only">${signup ? 'Create your account' : 'Log in'}</legend>
          ${fields.join('')}
          <p class="field-error" data-auth-error role="alert"></p>
          ${button({ label: signup ? 'Create my account' : 'Log in', type: 'submit', size: 'md', className: 'btn-block', 'data-auth-submit': true })}
        </fieldset>
      </form>
      <div class="auth-state" data-auth-signed-in hidden>
        <span class="auth-state-icon">${icon('check-circle')}</span>
        <h2 class="t-heading">You’re signed in.</h2>
        <p class="auth-lead">Pick up right where you left off.</p>
        ${button({ label: 'Continue to your path', href: SITE.appUrl, size: 'md', chev: true, className: 'btn-block' })}
      </div>
      <div class="auth-state" data-auth-inbox hidden tabindex="-1">
        <span class="auth-state-icon">${icon('mail')}</span>
        <h2 class="t-heading">Check your inbox.</h2>
        <p class="auth-lead">We sent a link to <strong data-auth-email></strong>. Open it to finish creating your account.</p>
        <p class="auth-hint">Can’t find it? Check your spam or junk folder. You can close this page while you verify.</p>
        ${button({ label: 'Back to log in', href: SITE.loginUrl, size: 'md', className: 'btn-block' })}
      </div>
      <p class="auth-notice" data-auth-notice hidden>${icon('key', 'icon icon-20')}<span data-auth-notice-text></span></p>
      <div class="auth-more" data-auth-more>
        <p class="auth-switch">${signup ? `Already have an account? <a class="link" href="${SITE.loginUrl}">Log in</a>` : `New here? <a class="link" href="${SITE.signupUrl}">Create an account</a>`}</p>
        <div class="auth-or"><span>or</span></div>
        ${button({ label: 'Explore without an account', href: SITE.appUrl, variant: 'outline', chev: true, className: 'btn-block' })}
      </div>
      <p class="auth-privacy">Your answers help shape your path. Read how we handle them in our <a class="link" href="/privacy">privacy policy</a>.</p>
    </div>
  </div>
</section>`;

  return {
    path: signup ? '/signup' : '/login',
    file: signup ? 'signup.html' : 'login.html',
    title: signup ? 'Create your account' : 'Log in',
    description: signup ? 'Create a free Fairylearn AI account to save your learning path and meet your AI guide.' : 'Log in to Fairylearn AI to continue your learning path.',
    bodyClass: 'page-auth',
    current: '',
    scripts: ['/assets/js/auth-page.mjs'],
    body
  };
}

export default () => [authPage('login'), authPage('signup')];
