// paths.mjs — /paths behavior: draws the winding trail behind each level's topic cards and
// keeps the sticky level switcher in sync with the section on screen.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Layout position of an element inside the trail. Uses offsets, not getBoundingClientRect, so the
// scroll-reveal transform on each card (translateY while hidden) never bends the line.
function offsetIn(el, root) {
  let x = 0, y = 0;
  for (let node = el; node && node !== root; node = node.offsetParent) { x += node.offsetLeft; y += node.offsetTop; }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
}

// Builds a gently meandering path through every stop's dot, in reading order. In one column
// (phones) it is a straight line through the dots, so it never pokes past the cards.
function trailPath(trail) {
  const points = [...trail.querySelectorAll('.paths-stop-dot')].map(dot => offsetIn(dot, trail));
  if (points.length < 2) return '';
  const oneColumn = points.every(point => Math.abs(point.x - points[0].x) < 4);
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  points.slice(1).forEach((q, i) => {
    const p = points[i];
    const dx = q.x - p.x, dy = q.y - p.y;
    if (oneColumn) {
      d += ` L ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    } else if (Math.abs(dy) < 4) {
      // Across a row: a soft sag between the two cards.
      d += ` C ${(p.x + dx / 3).toFixed(1)} ${(p.y + 36).toFixed(1)} ${(q.x - dx / 3).toFixed(1)} ${(q.y + 36).toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    } else {
      // Down to the next row: bow out to one side, alternating, so the line meanders.
      const bow = (i % 2 ? 1 : -1) * Math.min(44, Math.abs(dy) / 3);
      d += ` C ${(p.x + bow).toFixed(1)} ${(p.y + dy / 3).toFixed(1)} ${(q.x + bow).toFixed(1)} ${(q.y - dy / 3).toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
    }
  });
  return d;
}

document.querySelectorAll('[data-trail]').forEach(trail => {
  const bg = trail.querySelector('.paths-trail-bg');
  const draw = trail.querySelector('.paths-trail-draw');
  let drawn = reduceMotion;
  const layout = () => {
    const d = trailPath(trail);
    bg.setAttribute('d', d);
    draw.setAttribute('d', d);
    const length = draw.getTotalLength();
    draw.style.transition = 'none';
    draw.style.strokeDasharray = `${length}`;
    draw.style.strokeDashoffset = drawn ? '0' : `${length}`;
  };
  layout();
  new ResizeObserver(() => layout()).observe(trail);
  if (!drawn) {
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      drawn = true;
      draw.getBoundingClientRect();
      draw.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(0.22, 1, 0.36, 1)';
      draw.style.strokeDashoffset = '0';
      io.disconnect();
    }, { threshold: 0.2 });
    io.observe(trail);
  }
});

// Scroll-spy for the sticky Starter / Beginner / Medium / Expert switcher: the level whose top has
// passed the middle of the screen is current. Above the first level, none is.
const links = new Map([...document.querySelectorAll('[data-switch]')].map(link => [link.dataset.switch, link]));
const sections = [...document.querySelectorAll('[data-level]')];
let current, spyQueued = false;
const spy = () => {
  spyQueued = false;
  const line = innerHeight * 0.5;
  const active = sections.filter(section => section.getBoundingClientRect().top <= line).pop()?.dataset.level;
  if (active === current) return;
  current = active;
  links.forEach((link, key) => key === active ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current'));
};
if (links.size && sections.length) {
  addEventListener('scroll', () => { if (!spyQueued) { spyQueued = true; requestAnimationFrame(spy); } }, { passive: true });
  addEventListener('resize', spy);
  spy();
}
