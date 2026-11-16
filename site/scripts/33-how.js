// 33-how.js — "How it works" carousel, timed like the live quote carousel: advances every
// 4.5s while on screen, pauses on hover/focus, tabs jump directly, arrow keys move between
// tabs. The step text animates word by word via CSS (.how-word transitions).
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-how]').forEach(root => {
    const tabs = [...root.querySelectorAll('[data-how-tab]')];
    const steps = [...root.querySelectorAll('[data-how-step]')];
    const frames = [...root.querySelectorAll('[data-how-frame]')];
    const strip = root.querySelector('.how-tabs');
    const interval = Number(root.dataset.interval) || 4500;
    root.style.setProperty('--how-interval', `${interval}ms`);
    let index = 0, timer = null, paused = false, visible = false;

    const show = next => {
      index = (next + tabs.length) % tabs.length;
      tabs.forEach((tab, i) => { const on = i === index; tab.classList.toggle('is-active', on); tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1; });
      steps.forEach((step, i) => { const on = i === index; step.classList.toggle('is-active', on); step.setAttribute('aria-hidden', String(!on)); });
      frames.forEach((frame, i) => frame.classList.toggle('is-active', i === index));
      // On phones the tab row scrolls sideways: keep the active tab in view without moving the page.
      if (strip.scrollWidth > strip.clientWidth) {
        const offset = tabs[index].getBoundingClientRect().left - strip.getBoundingClientRect().left;
        strip.scrollTo({ left: strip.scrollLeft + offset - (strip.clientWidth - tabs[index].offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      root.classList.remove('is-timing');
      if (reduceMotion || paused || !visible) return;
      void root.offsetWidth; // restart the progress line
      root.classList.add('is-timing');
      timer = setTimeout(() => { show(index + 1); schedule(); }, interval);
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => { show(i); schedule(); });
      tab.addEventListener('keydown', event => {
        const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!offset) return;
        event.preventDefault(); show(index + offset); tabs[index].focus(); schedule();
      });
    });
    const card = root.querySelector('.how-card');
    card.addEventListener('pointerenter', () => { paused = true; schedule(); });
    card.addEventListener('pointerleave', () => { paused = false; schedule(); });
    root.addEventListener('focusin', event => { if (event.target.matches(':focus-visible')) { paused = true; schedule(); } });
    root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) { paused = false; schedule(); } });

    // Hold the first step's words until the card scrolls into view, then let them blur in.
    if (!reduceMotion) root.classList.add('is-waiting');
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) root.classList.remove('is-waiting');
      schedule();
    }, { threshold: 0.4 }).observe(card);
    show(index);
  });
})();
