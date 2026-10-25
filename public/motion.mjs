// Motion is decorative: it never delays rendering, captures input, or gates navigation.
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
const ease = 'cubic-bezier(.22, 1, .36, 1)';
let pendingLoads = 0;

export function logoMarkup(className = '') {
  return `<span class="logo-image ${className}" aria-hidden="true"><img src="/logo.png" alt="" width="160" height="160"><span class="logo-fallback">✳</span></span>`;
}

function prepareLogos(root) {
  root.querySelectorAll('.logo-image img').forEach(img => {
    const loaded = () => { if (img.naturalWidth) img.parentElement.classList.add('has-logo'); };
    if (img.complete) loaded();
    else img.addEventListener('load', loaded, { once: true });
  });
}

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

export function attachMotion(app) {
  let previousScreen = '';
  let previousStep = '';
  let previousLevel = '';
  let observer;
  let entrance;
  const visible = element => element.classList.add('is-revealed');
  const revealAll = () => {
    observer?.disconnect();
    app.querySelectorAll('.scroll-reveal').forEach(visible);
    if (preference.matches) app.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  };

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

  // Render observation keeps animations separate from auth, assessment, and focus logic.
  new MutationObserver(update).observe(app, { childList: true });
  preference.addEventListener('change', () => preference.matches ? revealAll() : observeScroll());
  app.addEventListener('focusin', event => {
    const target = event.target.closest('.scroll-reveal');
    if (target) visible(target);
  });
  update();
}
