// 20-features.js — the module accordions. Like the live reference: the open item follows the
// pointer, can be clicked, and auto-advances every few seconds while the list is on screen.
// A visual panel (data-target) shows the matching [data-feature-step] as .is-active.
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-features]').forEach(list => {
    const items = [...list.querySelectorAll('[data-feature]')];
    const interval = Number(list.dataset.interval) || 4500;
    const panel = list.dataset.target ? document.querySelector(list.dataset.target) : null;
    list.style.setProperty('--feature-interval', `${interval}ms`);
    let index = 0, timer = null, hovering = false, visible = false;

    const show = next => {
      index = (next + items.length) % items.length;
      items.forEach((item, i) => {
        const open = i === index;
        item.classList.toggle('is-open', open);
        item.classList.remove('is-timing');
        item.querySelector('.feature-title').setAttribute('aria-expanded', String(open));
      });
      panel?.querySelectorAll('[data-feature-step]').forEach(step => {
        const steps = step.dataset.featureStep.split(/\s+/).map(Number);
        step.classList.toggle('is-active', steps.includes(index));
      });
      panel?.setAttribute('data-active-step', String(index));
    };
    const schedule = () => {
      clearTimeout(timer);
      if (reduceMotion || hovering || !visible) return;
      const current = items[index];
      void current.offsetWidth; // restart the progress line
      current.classList.add('is-timing');
      timer = setTimeout(() => { show(index + 1); schedule(); }, interval);
    };

    items.forEach((item, i) => {
      item.addEventListener('pointerenter', event => { if (event.pointerType !== 'mouse') return; hovering = true; clearTimeout(timer); show(i); });
      item.querySelector('.feature-title').addEventListener('click', () => { show(i); schedule(); });
    });
    list.addEventListener('pointerleave', () => { hovering = false; schedule(); });
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? schedule() : clearTimeout(timer); }, { threshold: 0.35 }).observe(list);
    show(0);
  });
})();
