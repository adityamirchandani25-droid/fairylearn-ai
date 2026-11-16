// quiz.mjs — /quiz: a working quiz for the three free lessons plus a mixed challenge.
// The page ships the static shell (intro, topic picker, an empty quiz card, how-it-works row,
// closing band); site/scripts/modules/quiz.mjs runs the quiz in the browser with the same pure
// functions and questions the app uses (public/quiz.mjs, public/course.mjs).
import { courseModules } from '../../public/course.mjs';
import { passingScore, PASSING_SHARE } from '../../public/quiz.mjs';
import { button, explore, tag, icon } from '../lib/components.mjs';
import { escapeHtml as e } from '../lib/site.mjs';

const MIXED_TOTAL = 10;
const sentence = text => (text.charAt(0) + text.slice(1).toLowerCase()).replace(/\bai\b/gi, 'AI');

export default function quiz() {
  const topics = [
    ...courseModules.map(module => ({ id: module.id, label: module.title, meta: `${module.quiz.length} questions`, kicker: sentence(module.category), glyph: module.id === 'foundations' ? 'sprout' : module.id === 'tools' ? 'bulb' : 'heart' })),
    { id: 'mixed', label: 'Mixed challenge', meta: `${MIXED_TOTAL} questions`, kicker: 'All three lessons', glyph: 'layers' }
  ];
  const how = [
    { glyph: 'list', title: 'One question at a time', text: 'Pick an answer, then check it. Not quite? Try another until it clicks.' },
    { glyph: 'hint', title: 'Hints before answers', text: 'A nudge in the right direction when you need one. Your guide works the same way.' },
    { glyph: 'target', title: `${Math.round(PASSING_SHARE * 100)}% to pass`, text: `Answers right on the first try, without a hint, earn the point. ${passingScore(5)} of 5 passes.` }
  ];

  const body = `
<section class="page-intro quiz-intro">
  <div class="container">
    <div data-reveal>${tag('Quiz')}</div>
    <h1 class="t-display" data-reveal data-reveal-delay="0.05">See what stuck.</h1>
    <p class="t-lead" data-reveal data-reveal-delay="0.1">One question at a time, a hint when you need it, and no account needed. Pick a lesson to start.</p>
  </div>
</section>

<section class="quiz-stage" aria-labelledby="quiz-picker-title">
  <div class="container">
    <h2 class="sr-only" id="quiz-picker-title">Choose a quiz</h2>
    <div class="quiz-topics" role="radiogroup" aria-label="Choose a quiz" data-reveal>
      ${topics.map((topic, i) => `<button class="quiz-topic" type="button" role="radio" aria-checked="${i === 0}" data-topic="${topic.id}"${i === 0 ? '' : ' tabindex="-1"'}>
        <span class="quiz-topic-icon">${icon(topic.glyph, 'icon icon-20')}</span>
        <span class="quiz-topic-text"><span class="quiz-topic-kicker">${e(topic.kicker)}</span><span class="quiz-topic-label">${e(topic.label)}</span></span>
        <span class="quiz-topic-meta">${e(topic.meta)}</span>
      </button>`).join('')}
    </div>

    <p class="sr-only" aria-live="polite" data-quiz-live></p>
    <div class="quiz-card" data-quiz data-reveal data-reveal-delay="0.05">
      <noscript><p class="quiz-noscript">The quiz needs JavaScript. You can still read the <a class="link" href="/lessons">free lessons</a>.</p></noscript>
      <div class="quiz-loading" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>
  </div>
</section>

<section class="quiz-how" aria-labelledby="quiz-how-title">
  <div class="container">
    <h2 class="t-heading-lg" id="quiz-how-title" data-reveal>How quizzes work</h2>
    <div class="quiz-how-row">
      ${how.map((item, i) => `<div class="quiz-how-col" data-reveal data-reveal-delay="${(i * 0.08).toFixed(2)}">${icon(item.glyph, 'icon icon-32')}<h3>${e(item.title)}</h3><p>${e(item.text)}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="cta-band" aria-labelledby="quiz-cta-title">
  <div class="container cta-band-inner" data-reveal>
    <div><h2 class="t-heading-lg" id="quiz-cta-title">Keep your progress.</h2><p class="cta-band-sub">In the app, quizzes earn trophies. With a free account, your path is saved and AI writes a quiz for every lesson on it.</p></div>
    <div class="cta-band-actions">${button({ label: 'Start free', href: '/signup', size: 'md' })}${explore('/lessons', 'Back to lessons')}</div>
  </div>
</section>`;

  return {
    path: '/quiz',
    file: 'quiz.html',
    title: 'Quiz',
    description: 'Check what you learned in Fairylearn’s free AI lessons. One question at a time, hints when you need them, no account needed.',
    current: 'learn',
    bodyClass: 'page-quiz',
    body,
    scripts: ['/assets/js/quiz.mjs']
  };
}
