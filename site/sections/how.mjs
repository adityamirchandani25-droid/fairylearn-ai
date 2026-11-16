// how.mjs — "How it works": three step tabs over a card. Takes the slot of the live site's
// customer-quote carousel: the tab row stands in for the logo selector, the 32px step text
// for the quote (it animates in word by word), and a Bone panel of small UI fragments for
// the portrait. Behavior lives in site/scripts/33-how.js.
import { icon, labelMono } from '../lib/components.mjs';
import { pathLessons } from '../../public/path-lessons.mjs';
import { questions } from '../../public/learning.mjs';
import { escapeHtml as e } from '../lib/site.mjs';

const experience = questions.find(q => q.id === 'experience');

const steps = [
  {
    tab: 'Tell us about you',
    text: 'A few quick questions about what you know, what you love and where you want to go.',
    label: 'Step 01', note: 'About 2 minutes',
    visual: `<div class="how-q">
      <p class="how-q-kicker">Question 1 of 5</p>
      <p class="how-q-title">${e(experience.title)}</p>
      <ul class="how-options">${experience.options.map(([, title], i) => `<li class="how-option${i === 1 ? ' is-picked' : ''}"><span class="how-option-key">${String(i + 1).padStart(2, '0')}</span>${e(title)}${i === 1 ? `<span class="how-option-check">${icon('check', 'icon icon-16')}</span>` : ''}</li>`).join('')}</ul>
    </div>`
  },
  {
    tab: 'Get your path',
    text: 'Get a personal path that fits your experience, your goals and your everyday life.',
    label: 'Step 02', note: 'Made for you',
    visual: `<div class="how-path">
      <div class="how-level"><span class="how-level-icon">${icon('compass', 'icon icon-20')}</span><span><span class="how-level-kicker">Your starting level</span><span class="how-level-name">Beginner</span></span>${labelMono('Ready')}</div>
      <ol class="how-stops">${pathLessons.Beginner.slice(0, 3).map((lesson, i) => `<li class="how-stop${i === 0 ? ' is-next' : ''}"><span class="how-stop-dot"></span><span class="how-stop-title">${e(lesson.title)}</span><span class="how-stop-meta">${i === 0 ? 'Up next' : `Stop ${i + 1}`}</span></li>`).join('')}</ol>
    </div>`
  },
  {
    tab: 'Grow one step at a time',
    text: 'Follow a winding path of short lessons. Practice as you go, with your guide nearby whenever you need a hand.',
    label: 'Step 03', note: 'Your next little discovery',
    visual: `<div class="how-grow">
      <div class="how-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="how-ring-track"/><circle cx="60" cy="60" r="52" class="how-ring-fill" pathLength="100"/></svg><span class="how-ring-copy"><span class="how-ring-num">2<span>/3</span></span><span class="how-ring-label">lessons done</span></span></div>
      <ul class="how-wins">
        <li>${icon('check-circle', 'icon icon-20')}<span>Lesson complete</span><b>+1</b></li>
        <li>${icon('trophy', 'icon icon-20')}<span>Quiz 80%+</span><b>+3</b></li>
        <li class="is-soft">${icon('message', 'icon icon-20')}<span>Ask your guide</span><b>${icon('arrow-right', 'icon icon-16')}</b></li>
      </ul>
    </div>`
  }
];

const words = text => text.split(' ').map((word, i) => `<span class="how-word" style="--i:${i}">${e(word)}</span>`).join(' ');

export default function how() {
  return `<section class="how" id="how-it-works" aria-labelledby="how-title">
  <div class="container">
    <header class="how-head" data-reveal>
      <h2 class="t-heading-lg" id="how-title">How it works</h2>
      <p class="how-sub">Three small steps from curious to confident. No experience needed, just a little wonder.</p>
    </header>
    <div class="how-carousel" data-how data-interval="4500">
      <div class="how-tabs" role="tablist" aria-label="Steps" data-reveal data-reveal-delay="0.05">
        ${steps.map((step, i) => `<button class="how-tab${i === 0 ? ' is-active' : ''}" type="button" role="tab" id="how-tab-${i}" aria-controls="how-panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-how-tab="${i}"><span class="how-tab-num">0${i + 1}</span><span>${e(step.tab)}</span><span class="how-tab-line" aria-hidden="true"><i></i></span></button>`).join('')}
      </div>
      <div class="how-card" data-reveal data-reveal-delay="0.1">
        <div class="how-copy">
          ${steps.map((step, i) => `<div class="how-step${i === 0 ? ' is-active' : ''}" role="tabpanel" id="how-panel-${i}" aria-labelledby="how-tab-${i}" data-how-step="${i}">
            <p class="how-text">${words(step.text)}</p>
            <p class="how-meta"><span class="how-meta-label">${step.label}</span><span class="how-meta-note">${step.note}</span></p>
          </div>`).join('')}
        </div>
        <div class="how-visual" aria-hidden="true">
          ${steps.map((step, i) => `<div class="how-frame${i === 0 ? ' is-active' : ''}" data-how-frame="${i}">${step.visual}</div>`).join('')}
        </div>
      </div>
    </div>
  </div>
</section>`;
}
