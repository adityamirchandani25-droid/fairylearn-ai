// 00-core.js — behavior for the shared components: nav (scroll state, dropdowns, mobile
// menu), scroll reveal, count-up numbers and the storage notice. Concatenated with the other
// files in site/scripts into /assets/site.js; each file is wrapped in its own block.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.querySelector('[data-nav]');

  // Every page opens at the top unless the link names a section (#id). Browsers and embedded
  // viewers can otherwise restore an old scroll position when moving between pages.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const toTop = () => { if (!location.hash) window.scrollTo(0, 0); };
  toTop();
  addEventListener('pageshow', toTop);

  // Nav: a soft linen wash fades in once the page scrolls.
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Dropdowns: open on hover (with a short grace period) and on keyboard focus.
  document.querySelectorAll('[data-nav-item]').forEach(item => {
    const link = item.querySelector('.nav-link');
    let timer;
    const open = () => { clearTimeout(timer); document.querySelectorAll('[data-nav-item].is-open').forEach(other => other !== item && close(other)); item.classList.add('is-open'); link.setAttribute('aria-expanded', 'true'); };
    const close = target => { target.classList.remove('is-open'); target.querySelector('.nav-link').setAttribute('aria-expanded', 'false'); };
    item.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') open(); });
    item.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') timer = setTimeout(() => close(item), 160); });
    item.addEventListener('focusin', open);
    item.addEventListener('focusout', event => { if (!item.contains(event.relatedTarget)) close(item); });
    item.addEventListener('keydown', event => { if (event.key === 'Escape') { close(item); link.focus(); } });
    // Escape also closes a menu opened by hover, when focus is elsewhere on the page.
    addEventListener('keydown', event => { if (event.key === 'Escape' && item.classList.contains('is-open') && !item.contains(document.activeElement)) close(item); });
  });

  // Mobile menu.
  const burger = document.querySelector('[data-burger]');
  const setMenu = openMenu => {
    document.body.classList.toggle('nav-open', openMenu);
    burger?.setAttribute('aria-expanded', String(openMenu));
    burger?.setAttribute('aria-label', openMenu ? 'Close menu' : 'Open menu');
    document.documentElement.style.overflow = openMenu ? 'hidden' : '';
  };
  burger?.addEventListener('click', () => setMenu(!document.body.classList.contains('nav-open')));
  document.querySelectorAll('[data-mobile-menu] a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', event => { if (event.key === 'Escape' && document.body.classList.contains('nav-open')) setMenu(false); });
  matchMedia('(min-width: 1024px)').addEventListener('change', event => event.matches && setMenu(false));

  // Count-up numbers: <span data-count="3" data-count-decimals="0">3</span>
  const countUp = el => {
    const target = parseFloat(el.dataset.count);
    const decimals = Number(el.dataset.countDecimals || 0);
    if (reduceMotion || !Number.isFinite(target)) return;
    const start = performance.now(), duration = 1400;
    const step = now => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = (0).toFixed(decimals);
    requestAnimationFrame(step);
  };

  // Scroll reveal: [data-reveal] fades up once; [data-reveal-delay="0.1"] staggers.
  const revealables = document.querySelectorAll('[data-reveal], [data-count]');
  revealables.forEach(el => { if (el.dataset.revealDelay) el.style.setProperty('--reveal-delay', `${el.dataset.revealDelay}s`); });
  if ('IntersectionObserver' in window) {
    const pending = new Set(revealables);
    const reveal = el => {
      if (!pending.delete(el)) return;
      if (el.hasAttribute('data-reveal')) el.classList.add('is-in');
      if (el.hasAttribute('data-count') && !el.dataset.counted) { el.dataset.counted = '1'; countUp(el); }
      io.unobserve(el);
    };
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      // Reveal on entering, and also anything a fast scroll carried past without stopping.
      if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) reveal(entry.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealables.forEach(el => io.observe(el));
    // Keyboard focus never lands on something still invisible.
    addEventListener('focusin', event => { for (let el = event.target.closest?.('[data-reveal]'); el; el = el.parentElement?.closest('[data-reveal]')) reveal(el); });
    // Safety net for flings and busy frames: whatever has reached the viewport is shown.
    let queued = false;
    const sweep = () => { queued = false; const limit = innerHeight * 0.92; pending.forEach(el => { const box = el.getBoundingClientRect(); if (box.top < limit && (box.width || box.height)) reveal(el); }); };
    addEventListener('scroll', () => { if (pending.size && !queued) { queued = true; requestAnimationFrame(() => setTimeout(sweep, 120)); } }, { passive: true });
  } else revealables.forEach(el => el.classList.add('is-in'));

  // Storage notice (bottom-right). Remembered on this device only.
  const cookie = document.querySelector('[data-cookie]');
  let seen = false;
  try { seen = localStorage.getItem('fairylearn-storage-notice') === '1'; } catch {}
  // Phones: wait until the reader scrolls, so the notice never sits on the hero's button.
  if (cookie && !seen) {
    const show = () => { cookie.hidden = false; removeEventListener('scroll', onFirstScroll); };
    const onFirstScroll = () => { if (scrollY > 160) show(); };
    if (matchMedia('(max-width: 767px)').matches) addEventListener('scroll', onFirstScroll, { passive: true });
    else setTimeout(show, 900);
  }
  document.querySelector('[data-cookie-ok]')?.addEventListener('click', () => {
    cookie.hidden = true;
    try { localStorage.setItem('fairylearn-storage-notice', '1'); } catch {}
  });
})();
