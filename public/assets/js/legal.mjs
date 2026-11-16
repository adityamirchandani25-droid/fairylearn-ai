// legal.mjs — scroll-spy for the table of contents on /privacy, /terms and /references.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const links = new Map([...document.querySelectorAll('[data-toc-link]')].map(link => [link.hash.slice(1), link]));
const sections = [...document.querySelectorAll('[data-legal-section]')];

let activeId = null;
const setActive = id => {
  if (id === activeId) return;
  activeId = id;
  links.forEach((link, key) => {
    const active = key === id;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    // On phones the contents are a horizontal strip; keep the active chip in view without
    // moving the page. Positions are measured against the strip itself, because offsetLeft
    // is relative to the page container and would overshoot, hiding the first chip.
    const strip = link.closest('ol');
    if (active && strip.scrollWidth > strip.clientWidth) {
      const offset = link.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft;
      const target = Math.max(0, Math.min(offset - (strip.clientWidth - link.offsetWidth) / 2, strip.scrollWidth - strip.clientWidth));
      if (Math.abs(target - strip.scrollLeft) > 1) strip.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  });
};

// The active section is the last one whose top has passed a line just under the nav.
let ticking = false;
const update = () => {
  ticking = false;
  const line = 140;
  let current = sections[0]?.id;
  for (const section of sections) if (section.getBoundingClientRect().top - line <= 0) current = section.id;
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = sections.at(-1)?.id;
  setActive(current);
};
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
update();
