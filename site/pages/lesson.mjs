// lesson.mjs — /lessons/<slug>: one calm, editorial reading page per free essential.
import { button, explore, tag, labelMono, field, icon } from '../lib/components.mjs';
import { freeLessons, lessonImage, picture, SITE, escapeHtml as e } from '../lib/site.mjs';
import { sentenceCase } from './lessons.mjs';

const pad = n => String(n).padStart(2, '0');

function neighbour(lesson, label, direction) {
  if (!lesson) return '<span class="lesson-nav-empty" aria-hidden="true"></span>';
  const arrow = `<span class="lesson-nav-arrow">${icon(direction === 'prev' ? 'arrow-left' : 'arrow-right', 'icon icon-20')}</span>`;
  const text = `<span class="lesson-nav-text"><span class="meta">${label}</span><span class="lesson-nav-title">${e(lesson.title)}</span></span>`;
  return `<a class="lesson-nav-card is-${direction}" href="${lesson.url}">${direction === 'prev' ? arrow + text : text + arrow}</a>`;
}

// The same practice-prompt builder the app shows on this lesson. It runs entirely in the page.
const promptLab = () => `<section class="lesson-lab card" id="prompt-lab" data-toc-section aria-labelledby="lab-title">
        <div class="lesson-lab-head">
          <h2 class="t-subheading" id="lab-title">Build a practice prompt</h2>
          <p>Fill in the blanks and watch your prompt take shape. Nothing you type is sent anywhere.</p>
        </div>
        <form class="lesson-lab-form" data-prompt-lab>
          ${field({ label: 'My topic', name: 'topic', placeholder: 'e.g. photosynthesis', maxlength: 80, required: false, autocomplete: 'off' })}
          ${field({ label: 'What I want to practice', name: 'task', placeholder: 'e.g. a short quiz', maxlength: 80, required: false, autocomplete: 'off' })}
          ${field({ label: 'My grade', name: 'grade', placeholder: 'e.g. 10', maxlength: 20, required: false, autocomplete: 'off' })}
        </form>
        <div class="lesson-lab-preview">
          ${labelMono('Your prompt', true)}
          <p data-prompt-preview>Your prompt will appear here as you type.</p>
        </div>
      </section>
      `;

function page(lesson, index) {
  const prev = freeLessons[index - 1];
  const next = freeLessons[index + 1];
  const toc = [
    ...lesson.sections.map((section, i) => [`section-${i + 1}`, section.title]),
    ['your-turn', 'Your turn'],
    ...(lesson.id === 'tools' ? [['prompt-lab', 'Build a practice prompt']] : []),
    ['quiz', 'Check what stuck']
  ];
  const task = lesson.task.replace(/^Try it:\s*/, '');
  const body = `
<div class="lesson-progress" aria-hidden="true"><i data-lesson-progress></i></div>
<article class="lesson">
  <header class="page-intro container lesson-intro">
    <nav class="lesson-crumbs" aria-label="Breadcrumb" data-reveal><a class="link" href="/lessons">Lessons</a><span aria-hidden="true">/</span><span aria-current="page">Lesson ${lesson.number}</span></nav>
    <div data-reveal data-reveal-delay="0.04">${tag(sentenceCase(lesson.category))}</div>
    <h1 class="t-display" data-reveal data-reveal-delay="0.08">${e(lesson.title)}</h1>
    <p class="t-lead" data-reveal data-reveal-delay="0.12">${e(lesson.summary)}</p>
    <div class="lesson-meta" data-reveal data-reveal-delay="0.16">
      <span>${icon('clock', 'icon icon-20')}${e(lesson.time)} read</span>
      <span>${icon('check-square', 'icon icon-20')}${lesson.quiz.length}-question quiz</span>
      <span>${icon('trophy', 'icon icon-20')}${e(lesson.badge)} badge</span>
      ${labelMono('Free')}
    </div>
  </header>

  <div class="container">
    <figure class="lesson-figure media" data-reveal>${picture(lessonImage[lesson.id], { loading: 'eager', fetchpriority: 'high', sizes: '(min-width: 1200px) 1120px, 100vw' })}</figure>
  </div>

  <div class="container lesson-layout">
    <aside class="lesson-toc" aria-label="On this page">
      <p class="lesson-toc-label">On this page</p>
      <ol>${toc.map(([id, title], i) => `<li><a href="#${id}" data-toc-link="${id}"><span class="lesson-toc-n">${pad(i + 1)}</span>${e(title)}</a></li>`).join('')}</ol>
    </aside>

    <div class="lesson-prose">
      ${lesson.sections.map((section, i) => `<section class="lesson-section" id="section-${i + 1}" data-toc-section aria-labelledby="section-${i + 1}-title">
        <span class="label-mono is-neutral">${pad(i + 1)} / ${pad(lesson.sections.length)}</span>
        <h2 class="t-heading" id="section-${i + 1}-title">${e(section.title)}</h2>
        <p>${e(section.text)}</p>
      </section>`).join('')}

      <section class="lesson-turn card" id="your-turn" data-toc-section aria-labelledby="turn-title">
        <span class="lesson-turn-icon">${icon('pencil')}</span>
        <div>
          <h2 class="t-subheading" id="turn-title">Your turn</h2>
          <p>${e(task)}</p>
          <p class="lesson-turn-note">Jot it down anywhere. There’s no wrong answer, only a better question.</p>
        </div>
      </section>

      ${lesson.id === 'tools' ? promptLab() : ''}<section class="lesson-quiz panel" id="quiz" data-toc-section aria-labelledby="quiz-title">
        <div>
          ${labelMono(`${lesson.quiz.length} questions`)}
          <h2 class="t-heading" id="quiz-title">Check what stuck</h2>
          <p>One question at a time, with a hint if you need one. Pass with ${Math.ceil(lesson.quiz.length * 0.8)} of ${lesson.quiz.length} to earn the ${e(lesson.badge)} badge.</p>
        </div>
        ${button({ label: 'Take the quiz', href: `/quiz?lesson=${lesson.id}`, size: 'md', chev: true })}
      </section>

      <p class="lesson-source">${icon('book', 'icon icon-20')}<span>Further reading: <a class="link" href="${e(lesson.source)}" target="_blank" rel="noopener">${e(new URL(lesson.source).hostname.replace(/^www\./, ''))}</a></span></p>
    </div>
  </div>

  <nav class="container lesson-nav" aria-label="More lessons">
    ${neighbour(prev, `Lesson ${prev?.number ?? ''}`, 'prev')}
    ${neighbour(next, `Lesson ${next?.number ?? ''}`, 'next')}
  </nav>
</article>

<section class="cta-band" aria-labelledby="lesson-cta-title">
  <div class="container cta-band-inner" data-reveal>
    <div><h2 class="t-heading-lg" id="lesson-cta-title">Keep the curiosity going.</h2><p class="cta-band-sub">A free account picks your next lessons and saves your path.</p></div>
    <div class="cta-band-actions">${button({ label: 'Find my path', href: SITE.signupUrl, size: 'md' })}${explore('/lessons', 'All lessons')}</div>
  </div>
</section>`;
  return {
    path: lesson.url, file: `lessons/${lesson.slug}.html`, current: 'learn', bodyClass: 'page-lesson',
    title: lesson.title,
    description: `${lesson.summary} A free ${lesson.time} Fairylearn lesson with a ${lesson.quiz.length}-question quiz.`,
    scripts: ['/assets/js/lesson.mjs'],
    body
  };
}

export default () => freeLessons.map(page);
