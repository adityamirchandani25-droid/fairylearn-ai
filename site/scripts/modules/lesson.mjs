// lesson.mjs — the lesson detail page: reading progress line, the "On this page" highlight and
// the practice-prompt builder (same wording as the app's builder in public/app.mjs).
const bar = document.querySelector('.lesson-progress');
const article = document.querySelector('.lesson');

let ticking = false;
function updateProgress() {
  ticking = false;
  const start = article.offsetTop;
  const end = start + article.offsetHeight - innerHeight;
  const progress = Math.min(1, Math.max(0, (scrollY - start) / Math.max(1, end - start)));
  bar.style.setProperty('--lesson-progress', progress.toFixed(4));
}
if (bar && article) {
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  addEventListener('resize', updateProgress);
  updateProgress();
}

// Highlight the section nearest the top of the reading area.
const links = new Map([...document.querySelectorAll('[data-toc-link]')].map(link => [link.dataset.tocLink, link]));
const sections = [...document.querySelectorAll('[data-toc-section]')];
const visible = new Set();
const setCurrent = id => links.forEach((link, key) => {
  const current = key === id;
  link.classList.toggle('is-current', current);
  if (current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
});
if (sections.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id));
    const first = sections.find(section => visible.has(section.id));
    if (first) setCurrent(first.id);
  }, { rootMargin: '-20% 0px -55% 0px' });
  sections.forEach(section => io.observe(section));
  setCurrent(sections[0].id);
}

const lab = document.querySelector('[data-prompt-lab]');
const preview = document.querySelector('[data-prompt-preview]');
if (lab && preview) {
  const render = () => {
    const values = Object.fromEntries(['topic', 'task', 'grade'].map(name => [name, lab.elements[name].value.trim()]));
    const filled = values.topic || values.task || values.grade;
    preview.classList.toggle('is-empty', !filled);
    preview.textContent = filled
      ? `I am in grade ${values.grade || '___'}. Help me learn ${values.topic || '___'} by giving me ${values.task || '___'}. Ask one question at a time and explain any mistakes.`
      : 'Your prompt will appear here as you type.';
  };
  lab.addEventListener('input', render);
  lab.addEventListener('submit', event => event.preventDefault());
  render();
}
