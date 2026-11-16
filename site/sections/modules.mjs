// modules.mjs — the three product modules (Find your path, Learn, Practice).
// Each module follows the live anatomy: tag, 44px heading, Explore pill, Stone subline, then a
// 496px Bone visual beside a 496px feature accordion. The visuals are HTML/SVG product
// fragments; the open accordion item highlights its matching fragment ([data-feature-step]).
// Practice is a deliberate deviation: one full-width panel with four micro-features below.
import { sectionHead, features, icon, labelMono } from '../lib/components.mjs';
import { escapeHtml as e } from '../lib/site.mjs';
import { courseModules } from '../../public/course.mjs';
import { pathLessons } from '../../public/path-lessons.mjs';
import { questions, levels } from '../../public/learning.mjs';

const head = d => `<path class="mv-arrow-head" d="${d}"/>`;

function option([, label], selected) {
  return `<li class="mv-option${selected ? ' is-selected' : ''}"><i class="mv-radio" aria-hidden="true"></i><span>${e(label)}</span></li>`;
}

// ── Module 1 · Find your path ─────────────────────────────────────────────
function findPathVisual() {
  const [experience, knowledge] = questions;
  const path = pathLessons.Beginner.slice(0, 3);
  const levelIndex = levels.indexOf('Beginner');
  return `<div class="panel mv mv-find" id="mv-find" aria-hidden="true"><div class="mv-stage">
    <svg class="mv-arrow" viewBox="0 0 496 496" aria-hidden="true"><path d="M124 200 C 124 240, 142 266, 182 268"/>${head('M175 262.5 L182 268 L175 273.5')}<path d="M404 324 C 404 376, 392 404, 354 406"/>${head('M361 400.5 L354 406 L361 411.5')}</svg>
    <div class="mv-card mv-q" data-feature-step="0 1">
      <div class="mv-swap" data-feature-step="0"><div class="mv-card-top"><span class="mv-step">Question 1 of 5</span></div><p class="mv-q-title">${e(experience.title)}</p><ul class="mv-options">${experience.options.slice(0, 2).map((o, i) => option(o, i === 1)).join('')}</ul></div>
      <div class="mv-swap" data-feature-step="1"><div class="mv-card-top"><span class="mv-step">Question 2 of 5</span></div><p class="mv-q-title">${e(knowledge.title)}</p><ul class="mv-options">${knowledge.options.slice(0, 2).map((o, i) => option(o, i === 1)).join('')}</ul></div>
    </div>
    <div class="mv-card mv-level" data-feature-step="2">
      <div class="mv-card-top"><span class="mv-ico">${icon('target')}</span><span class="mv-muted">Your starting level</span>${labelMono('Ready')}</div>
      <p class="mv-level-name">Beginner</p>
      <ol class="mv-steps">${levels.map((level, i) => `<li class="${i < levelIndex ? 'is-past' : i === levelIndex ? 'is-current' : ''}" style="--h:${0.75 + i * 0.5}em"><i></i><span>${level}</span></li>`).join('')}</ol>
    </div>
    <div class="mv-card mv-mini-path" data-feature-step="3">
      <div class="mv-card-top"><span class="mv-ico">${icon('route')}</span><span class="mv-muted">Your path</span><span class="mv-chip">${icon('refresh')}Update answers</span></div>
      <ol>${path.map((lesson, i) => `<li class="${i === 0 ? 'is-current' : ''}"><span class="mv-num">${String(i + 1).padStart(2, '0')}</span><span>${e(lesson.title)}</span></li>`).join('')}</ol>
    </div>
  </div></div>`;
}

// ── Module 2 · Learn ──────────────────────────────────────────────────────
function learnVisual() {
  const lesson = courseModules[0];
  const stops = [[60, 410, 'done'], [150, 384, 'done'], [240, 372, 'current'], [330, 330, 'next'], [410, 318, 'next'], [470, 250, 'new']];
  return `<div class="panel mv mv-learn" id="mv-learn" aria-hidden="true"><div class="mv-stage">
    <svg class="mv-trail" viewBox="0 0 496 496" aria-hidden="true">
      <path class="mv-trail-done" d="M0 448 C 30 432, 40 414, 60 410 S 120 380, 150 384 S 210 380, 240 372"/>
      <path class="mv-trail-next" d="M240 372 S 300 335, 330 330 S 390 330, 410 318"/>
      <path class="mv-trail-new" data-feature-step="3" d="M410 318 S 455 275, 470 250 S 490 236, 500 234"/>
      ${stops.map(([x, y, state], i) => `<g class="mv-stop is-${state}"${state === 'new' ? ' data-feature-step="3"' : ''} transform="translate(${x} ${y})"><circle r="${state === 'current' ? 11 : 8}"/>${state === 'done' ? '<path d="M-3.5 0.5 l2.5 2.5 l4.5 -5"/>' : ''}${state === 'current' ? '<circle class="mv-pulse" r="11"/>' : ''}</g>`).join('')}
    </svg>
    <div class="mv-card mv-lesson" data-feature-step="0 1">
      <div class="mv-swap" data-feature-step="0">
        <div class="mv-card-top"><span class="mv-step">Lesson ${lesson.number} · ${e(lesson.time)}</span>${labelMono('Free')}</div>
        <p class="mv-lesson-title">${e(lesson.title)}</p>
        <ol class="mv-sections">${lesson.sections.map((s, i) => `<li class="${i === 0 ? 'is-done' : i === 1 ? 'is-current' : ''}"><span class="mv-num">${String(i + 1).padStart(2, '0')}</span><span>${e(s.title)}</span></li>`).join('')}</ol>
      </div>
      <div class="mv-swap" data-feature-step="1">
        <div class="mv-card-top"><span class="mv-ico">${icon('sparkle')}</span><span class="mv-muted">Written for Beginner</span></div>
        <p class="mv-lesson-title">${e(pathLessons.Beginner[1].title)}</p>
        <ol class="mv-sections"><li class="is-current"><span class="mv-num">01</span><span>Start with your goal</span></li><li><span class="mv-num">02</span><span>Add context and format</span></li><li><span class="mv-num">03</span><span>Review, then revise</span></li></ol>
      </div>
    </div>
    <div class="mv-card mv-pace" data-feature-step="2">
      <div class="mv-card-top"><span class="mv-ico">${icon('clock')}</span><span class="mv-muted">Time each day</span></div>
      <div class="mv-seg">${questions[4].options.map(([value], i) => `<span class="${i === 1 ? 'is-on' : ''}">${value}${i === 3 ? '+' : ''} min</span>`).join('')}</div>
    </div>
    <div class="mv-card mv-chapter" data-feature-step="3"><span class="mv-ico">${icon('route')}</span><span>New chapter · 6 lessons</span></div>
  </div></div>`;
}

// ── Module 3 · Practice (full-width panel) ────────────────────────────────
function practiceVisual() {
  const q = courseModules[1].quiz[1];
  return `<div class="panel mv mv-practice" id="mv-practice" aria-hidden="true"><div class="mv-wide">
    <div class="mv-card mv-quiz" data-feature-step="0 1">
      <div class="mv-card-top"><span class="mv-step">Question 2 of ${courseModules[1].quiz.length}</span><span class="mv-hint" data-feature-step="1">${icon('hint')}Hint</span></div>
      <p class="mv-q-title">${e(q.question)}</p>
      <ul class="mv-options">${q.choices.map((choice, i) => `<li class="mv-option${i === q.answer ? ' is-correct' : ''}"><i class="mv-radio" aria-hidden="true"></i><span>${e(choice)}</span>${i === q.answer ? labelMono('Correct') : ''}</li>`).join('')}</ul>
    </div>
    <svg class="mv-link" viewBox="0 0 64 16" aria-hidden="true"><path d="M2 8 H60"/><path d="M54 3 L60 8 L54 13"/></svg>
    <div class="mv-chat" data-feature-step="3">
      <p class="mv-bubble is-learner">What goes in a good prompt?</p>
      <div class="mv-bubble is-guide"><span class="mv-guide-name">${icon('sparkle')}Your guide</span><p>Try three parts: the task, a little context, and the format you want. Like “I’m in grade 9 biology. Ask me three short questions.”</p></div>
      <p class="mv-bubble is-learner is-typing"><i></i><i></i><i></i></p>
    </div>
    <svg class="mv-link" viewBox="0 0 64 16" aria-hidden="true"><path d="M2 8 H60"/><path d="M54 3 L60 8 L54 13"/></svg>
    <div class="mv-card mv-trophy" data-feature-step="2">
      <span class="mv-trophy-ico">${icon('trophy', 'icon icon-32')}</span>
      <p class="mv-trophy-num">+3</p>
      <p class="mv-muted">trophies · quiz 80%+</p>
      ${labelMono('Saved')}
    </div>
  </div></div>`;
}

function module({ id, tagLabel, title, sub, href, visual, items, reverse }) {
  const list = `<div class="module-list" data-reveal data-reveal-delay="0.1">${features(items, { target: `#${id}` })}</div>`;
  const vis = `<div class="module-visual" data-reveal>${visual}</div>`;
  return `<section class="module" aria-labelledby="${id}-title"><div class="module-inner">
  ${sectionHead({ tagLabel, title, sub, href, id: `${id}-title` })}
  <div class="module-row${reverse ? ' is-reverse' : ''}">${reverse ? list + vis : vis + list}</div>
</div></section>`;
}

export default function modules() {
  const practiceItems = [
    { icon: 'list', title: 'One question at a time', text: 'Short quizzes that check what stuck, without the pressure.' },
    { icon: 'hint', title: 'Hints before answers', text: 'Get a nudge in the right direction, then try again.' },
    { icon: 'trophy', title: 'Trophies for little wins', text: 'Finish a lesson for +1, score 80% or more for +3.' },
    { icon: 'message', title: 'A guide nearby', text: 'Ask in your own words. It explains things another way.' }
  ];
  return `<div class="modules" id="product">
${module({
  id: 'mv-find', tagLabel: 'Find your path', title: 'Five small questions. One path that fits.',
  sub: 'Tell us what you know and how you like to learn. We’ll find your starting level.', href: '/paths',
  visual: findPathVisual(),
  items: [
    { icon: 'list', title: 'Five quick questions', text: 'About two minutes, and there are no wrong answers. Just tell us where you are.' },
    { icon: 'question', title: 'A gentle knowledge check', text: 'One small question checks what you already know, so you start in the right place.' },
    { icon: 'target', title: 'Your starting level', text: 'Starter, Beginner, Medium or Expert. Your path begins exactly there.' },
    { icon: 'refresh', title: 'Change it anytime', text: 'Update your answers whenever you like and your path rebuilds around you.' }
  ]
})}
${module({
  id: 'mv-learn', tagLabel: 'Learn', title: 'Small lessons along a winding path.',
  sub: 'Short, friendly lessons that build on each other, at a pace that feels like you.', href: '/lessons', reverse: true,
  visual: learnVisual(),
  items: [
    { icon: 'book', title: 'Three free essentials', text: 'Start learning right away, no account needed. Each one ends with a quick quiz.' },
    { icon: 'sparkle', title: 'Lessons shaped by AI', text: 'With a free account, AI picks and writes lessons for your level and goals.' },
    { icon: 'clock', title: 'Your own pace', text: 'Five, ten, twenty or thirty minutes a day. Whatever leaves room for wonder.' },
    { icon: 'route', title: 'A path that keeps going', text: 'When you near the end, a new chapter of lessons appears. Curiosity has no finish line.' }
  ]
})}
<section class="module module-practice" aria-labelledby="mv-practice-title"><div class="module-inner">
  ${sectionHead({ tagLabel: 'Practice', title: 'Practice, with a hint when you need it.', sub: 'Every lesson ends with a quick quiz. Your guide is there when a question feels tricky.', href: '/quiz', id: 'mv-practice-title' })}
  <div class="module-wide" data-reveal>${practiceVisual()}</div>
  <div class="micro-row" data-reveal data-reveal-delay="0.1">${features(practiceItems, { target: '#mv-practice' })}</div>
</div></section>
</div>`;
}
