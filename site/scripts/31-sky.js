// 31-sky.js — gentle parallax on the sky band art (max 60px either way). Off for reduced motion.
(() => {
  const art = document.querySelector('[data-sky-parallax]');
  if (!art || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const band = art.parentElement;
  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = band.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const progress = (innerHeight - rect.top) / (innerHeight + rect.height); // 0 → 1 across the viewport
    art.style.transform = `translate3d(0, ${((progress - 0.5) * 120).toFixed(1)}px, 0)`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();
