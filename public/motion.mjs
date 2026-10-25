// motion.mjs — the gentle animations, the loading indicator and the logo markup.
//
// Design rules for everything in this file:
//   - Animations are decorations only. The page works and is fully readable without them.
//   - Learners who turn on "reduce motion" in their operating system get no movement at all
//     (prefers-reduced-motion), and everything is shown immediately.
//   - Nothing here waits on an animation before showing content or reacting to input.
//
// preference: a live media query for the reduce-motion setting; .matches is true when it is on.
// ease: an "ease-out" curve: fast at the start, softly settling at the end.
// pendingLoads: how many loading indicators are currently requested (see startLoading).
//
// Motion is decorative: it never delays rendering, captures input, or gates navigation.
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
const ease = 'cubic-bezier(.22, 1, .36, 1)';
let pendingLoads = 0;

// The HTML for the Fairylearn logo. It includes a ✳ fallback symbol that shows if the image
// fails to load; CSS hides the fallback once the image has loaded (the .has-logo class).
// aria-hidden: the logo is decorative, because the brand name is written next to it.
export function logoMarkup(className = '') {
  return `<span class="logo-image ${className}" aria-hidden="true"><img src="/logo.png" alt="" width="160" height="160"><span class="logo-fallback">✳</span></span>`;
}

// Adds the has-logo class to every logo whose image has actually loaded (naturalWidth > 0
// means the browser decoded a real image). Images that are still loading get a one-time
// listener instead.
function prepareLogos(root) {
  root.querySelectorAll('.logo-image img').forEach(img => {
    const loaded = () => { if (img.naturalWidth) img.parentElement.classList.add('has-logo'); };
    if (img.complete) loaded();
    else img.addEventListener('load', loaded, { once: true });
  });
}

// Shows the small "Your fairy is writing a lesson..." loading badge and returns a function that
// hides it again. Usage:
//   const stop = startLoading('Saving…');
//   try { await work(); } finally { stop(); }
// Several pieces of code may be loading at once, so the badge uses a counter: it only
// disappears when every caller has called its stop function. Calling the same stop function
// twice is harmless (the `stopped` flag).
// The badge is created once and reused. role="status" with aria-live="polite" makes screen
// readers announce the label without interrupting the learner.
export function startLoading(label = 'A little moment…') {
  let status = document.querySelector('#loading-status');
  if (!status) {
    status = document.createElement('div');
    status.id = 'loading-status';
    status.className = 'loading-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.innerHTML = `${logoMarkup('loading-logo')}<span class="loading-copy"></span><span class="loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
    document.body.append(status);
    prepareLogos(status);
  }
  status.querySelector('.loading-copy').textContent = label;
  pendingLoads++;
  status.classList.add('is-loading');
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    if (--pendingLoads === 0) status.classList.remove('is-loading');
  };
}

// Watches the app container and plays entrance animations whenever the page content changes.
// app.mjs never has to call animation code directly: it renders HTML, and this reacts to it.
//   previousScreen/Step/Level — what was showing last time, so we only animate real changes;
//   observer — the IntersectionObserver for scroll reveals;
//   entrance — the currently running entrance animation, cancelled if a new one starts.
export function attachMotion(app) {
  let previousScreen = '';
  let previousStep = '';
  let previousLevel = '';
  let observer;
  let entrance;
  // visible() shows an element that was waiting to be revealed; revealAll() shows everything at
  // once (used when motion is reduced, or the browser lacks IntersectionObserver).
  const visible = element => element.classList.add('is-revealed');
  const revealAll = () => {
    observer?.disconnect();
    app.querySelectorAll('.scroll-reveal').forEach(visible);
    if (preference.matches) app.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  };

  // Scroll reveals: sections further down the page fade in when they scroll into view.
  // Elements already on screen are shown immediately. The rest get the scroll-reveal class
  // (hidden by CSS) and are watched; when 8% of one becomes visible it is revealed and no longer
  // watched. Neighbouring elements get a small staggered delay (up to 3 × 65 ms) so they appear
  // one after another.
  function observeScroll() {
    observer?.disconnect();
    if (preference.matches || !('IntersectionObserver' in window)) return revealAll();
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        visible(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    const elements = app.querySelectorAll('.value-strip > span, .section-intro, .steps-grid > article, .paths-section > .eyebrow, .paths-section > h2, .paths-section > p, .level-preview > div, .paths-section > .button, .personal-plan, .curriculum-heading, .lessons > article, .tutor-banner, footer');
    elements.forEach(element => {
      // Content already in view stays visible during choices and tab changes.
      if (element.getBoundingClientRect().top < window.innerHeight - 24) return visible(element);
      element.classList.add('scroll-reveal');
      const siblings = [...element.parentElement.children];
      element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element), 3) * 65}ms`);
      observer.observe(element);
    });
  }

  // Runs after every render. It works out what kind of change happened:
  //   routeChanged — a different page (the <main> class changed, or login ↔ sign-up);
  //   stepChanged  — the next questionnaire question;
  //   levelChanged — a different level tab on the dashboard.
  // It then plays one short fade-and-rise animation on the part that changed. On the home page
  // the hero text also arrives line by line.
  function update() {
    prepareLogos(app);
    const main = app.querySelector('main');
    if (!main) return;
    const screen = main.className || 'home';
    const screenKey = `${screen}:${app.querySelector('#auth-form')?.dataset.mode || ''}`;
    const question = app.querySelector('.question-kicker')?.textContent || '';
    const level = app.querySelector('[role="tab"][aria-selected="true"]')?.id || '';
    const routeChanged = screenKey !== previousScreen;
    const stepChanged = screen === 'onboarding' && question !== previousStep;
    const levelChanged = screen === 'dashboard' && level !== previousLevel;
    const target = routeChanged ? main : stepChanged ? app.querySelector('.question-card-content') : levelChanged ? app.querySelector('#lesson-panel') : null;
    if (target && !preference.matches && target.animate) {
      entrance?.cancel();
      entrance = target.animate([
        { opacity: 0, transform: stepChanged ? 'translateY(5px)' : 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: routeChanged ? 430 : 300, easing: ease });
      if (routeChanged && screen === 'home') {
        app.querySelectorAll('.hero-copy > *').forEach((element, index) => {
          element.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 500, delay: Math.min(index, 4) * 55, easing: ease, fill: 'backwards' });
        });
      }
    }
    previousScreen = screenKey;
    previousStep = question;
    previousLevel = level;
    observeScroll();
  }

  // MutationObserver calls update() whenever app.mjs replaces the page content (childList).
  // The other listeners react to the reduce-motion setting changing while the page is open, and
  // reveal a hidden section as soon as keyboard focus moves into it, so keyboard users never tab
  // into invisible content.
  // Render observation keeps animations separate from auth, assessment, and focus logic.
  new MutationObserver(update).observe(app, { childList: true });
  preference.addEventListener('change', () => preference.matches ? revealAll() : observeScroll());
  app.addEventListener('focusin', event => {
    const target = event.target.closest('.scroll-reveal');
    if (target) visible(target);
  });
  update();
}
