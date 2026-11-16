// lessons.mjs — /lessons: the three free essentials, the AI guide, and what comes next.
import { pathLessons } from '../../public/path-lessons.mjs';
import { button, explore, tag, labelMono, icon } from '../lib/components.mjs';
import { freeLessons, lessonImage, picture, levelBlurbs, SITE, escapeHtml as e } from '../lib/site.mjs';

// "AI FUNDAMENTALS" → "AI fundamentals"
export const sentenceCase = text => text.toLowerCase().replace(/^./, c => c.toUpperCase()).replace(/\bai\b/gi, 'AI');

function lessonCard(lesson, i) {
  const featured = i === 0;
  return `<article class="lessons-card${featured ? ' is-featured' : ''}" data-reveal data-reveal-delay="${(i * 0.08).toFixed(2)}">
  <a class="lessons-card-link" href="${lesson.url}" aria-label="${e(lesson.title)}, lesson ${lesson.number}">
    <div class="lessons-card-media">${picture(lessonImage[lesson.id], { sizes: featured ? '(min-width: 1024px) 640px, 100vw' : '(min-width: 768px) 50vw, 100vw' })}<span class="lessons-card-cat">${e(sentenceCase(lesson.category))}</span></div>
    <div class="lessons-card-body">
      <span class="lessons-card-num">Lesson ${lesson.number}</span>
      <h2 class="lessons-card-title">${e(lesson.title)}</h2>
      <p class="lessons-card-summary">${e(lesson.summary)}</p>
      <div class="lessons-card-meta"><span class="meta">${e(lesson.time)} · ${lesson.quiz.length}-question quiz</span>${labelMono('Free')}</div>
      <span class="lessons-card-cta">Start lesson ${icon('arrow-right', 'icon icon-20')}</span>
    </div>
  </a>
</article>`;
}

const guideFacts = [
  ['message', 'Plain answers', 'Short, clear explanations in everyday words, with an example when it helps.'],
  ['hint', 'Hints before answers', 'Stuck on a quiz? You get a nudge and the reasoning first, not just the answer.'],
  ['lock', 'Never asks for personal details', 'No passwords, keys or private information. Ever.'],
  ['user', 'Needs a free account', 'Your guide adapts to your level and the lesson you’re on.']
];

const chat = `<div class="lessons-chat" aria-hidden="true">
  <div class="lessons-chat-head"><span class="lessons-chat-avatar">${icon('sparkle', 'icon icon-16')}</span><span>Your guide</span>${labelMono('Ready')}</div>
  <p class="lessons-bubble is-learner">Why does my prompt keep giving me vague answers?</p>
  <p class="lessons-bubble is-guide">Try giving it three things: the task, a little context, and the format you want. For example: “I’m in grade 9 biology. Ask me three short questions about photosynthesis, one at a time.”</p>
  <p class="lessons-bubble is-learner">So more like a recipe?</p>
  <p class="lessons-bubble is-guide">Exactly. Want to try rewriting yours together?</p>
  <span class="lessons-typing"><i></i><i></i><i></i></span>
</div>`;

export default function lessons() {
  const levels = Object.keys(pathLessons);
  const body = `
<section class="page-intro container">
  <div data-reveal>${tag('Lessons')}</div>
  <h1 class="t-display" data-reveal data-reveal-delay="0.05">Small lessons. Big ideas.</h1>
  <p class="t-lead" data-reveal data-reveal-delay="0.1">Start with three free essentials. No account needed, just a few minutes and a little curiosity.</p>
</section>

<section class="container lessons-grid" aria-label="Free essentials">
  ${freeLessons.map(lessonCard).join('')}
</section>

<section class="lessons-guide container" id="guide" aria-labelledby="guide-title">
  <div class="lessons-guide-copy">
    <div data-reveal>${tag('AI guide')}</div>
    <h2 class="t-heading-lg" id="guide-title" data-reveal data-reveal-delay="0.05">A guide that answers back.</h2>
    <p class="lessons-sub" data-reveal data-reveal-delay="0.1">When a lesson feels tricky, ask in your own words. Your guide explains it another way, at your level.</p>
    <ul class="lessons-guide-facts">${guideFacts.map(([ic, title, text], i) => `<li data-reveal data-reveal-delay="${(0.12 + i * 0.06).toFixed(2)}">${icon(ic)}<div><h3>${title}</h3><p>${text}</p></div></li>`).join('')}</ul>
    <p class="lessons-guide-note">AI can make mistakes. Check important facts.</p>
  </div>
  <div class="lessons-guide-panel panel" data-reveal data-reveal-delay="0.1">${chat}</div>
</section>

<section class="lessons-next container" aria-labelledby="next-title">
  <header class="section-head" data-reveal>${tag('What comes next')}<h2 class="t-heading-lg" id="next-title">Forty more topics, four levels.</h2>${explore('/paths', 'See the paths')}<p class="section-sub">With a free account, your path picks up from here. These are the first few stops on each level.</p></header>
  <div class="lessons-levels">${levels.map((level, i) => `<div class="lessons-level" data-reveal data-reveal-delay="${(i * 0.06).toFixed(2)}">
    <span class="lessons-level-name">${level}</span>
    <p class="lessons-level-blurb">${levelBlurbs[level]}</p>
    <ol>${pathLessons[level].slice(0, 3).map((topic, n) => `<li><span class="lessons-level-n">${String(n + 1).padStart(2, '0')}</span>${e(topic.title)}</li>`).join('')}</ol>
    <a class="lessons-level-more link" href="/paths#${level.toLowerCase()}">+${pathLessons[level].length - 3} more</a>
  </div>`).join('')}</div>
</section>

<section class="cta-band" aria-labelledby="lessons-cta-title">
  <div class="container cta-band-inner" data-reveal>
    <div><h2 class="t-heading-lg" id="lessons-cta-title">Ready for your own path?</h2><p class="cta-band-sub">Answer five quick questions and we’ll find where you start.</p></div>
    <div class="cta-band-actions">${button({ label: 'Start free', href: SITE.signupUrl, size: 'md' })}${explore('/paths', 'See the paths')}</div>
  </div>
</section>`;
  return {
    path: '/lessons', file: 'lessons.html', current: 'learn', bodyClass: 'page-lessons',
    title: 'Lessons',
    description: 'Three free AI essentials for curious high school students: how AI learns, asking better questions, and using AI with care. No account needed.',
    body
  };
}
