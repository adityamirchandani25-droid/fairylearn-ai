// paths.mjs — /paths: how placement works, and the four levels with every catalog topic.
// All content comes from public/learning.mjs (the five questions and the level rule) and
// public/path-lessons.mjs (the 40 approved topics).
import { questions, levels } from '../../public/learning.mjs';
import { pathLessons } from '../../public/path-lessons.mjs';
import { button, explore, tag, labelMono, icon } from '../lib/components.mjs';
import { levelBlurbs, SITE, escapeHtml as e } from '../lib/site.mjs';

const pad = n => String(n).padStart(2, '0');
const host = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'source'; } };

// Four rising bars; the first `level + 1` are filled.
const steps = active => `<span class="paths-steps" role="img" aria-label="Level ${active + 1} of 4">${levels.map((_, i) => `<i class="${i <= active ? 'is-on' : ''}" style="height:${8 + i * 6}px"></i>`).join('')}</span>`;

function placement() {
  const first = questions[0];
  return `<section class="paths-placement section" id="placement" aria-labelledby="placement-title">
  <div class="container">
    <header class="paths-head" data-reveal>
      <h2 class="t-heading-lg" id="placement-title">How placement works</h2>
      <p class="paths-sub">Five quick questions, about two minutes. There are no wrong answers, only a starting point.</p>
    </header>
    <div class="paths-placement-grid">
      <ol class="paths-questions">
        ${questions.map((q, i) => `<li data-reveal data-reveal-delay="${(i * 0.06).toFixed(2)}"><span class="paths-num">${pad(i + 1)}</span><div><h3>${e(q.title)}</h3><p>${e(q.subtitle)}</p></div></li>`).join('')}
      </ol>
      <div class="paths-placement-side" data-reveal data-reveal-delay="0.1">
        <div class="panel paths-qpanel">
          <div class="paths-qcard">
            <div class="paths-qcard-top"><span>Question 1 of 5</span>${labelMono('About 2 min', true)}</div>
            <p class="paths-qtitle">${e(first.title)}</p>
            <ul class="paths-chips">${first.options.map(([value, label, text], i) => `<li class="${i === 1 ? 'is-picked' : ''}"><span class="paths-chip-dot" aria-hidden="true"></span><span><b>${e(label)}</b><small>${e(text)}</small></span></li>`).join('')}</ul>
          </div>
        </div>
        <div class="card paths-rule">
          <div class="paths-rule-head">${icon('target')}<h3>How your level is chosen</h3></div>
          <p>Your answer to question 1 sets a base level: ${first.options.map(([, label], i) => `<em>${e(label)}</em> → ${levels[i]}`).join(', ')}.</p>
          <p>If the knowledge check isn’t “Creates from learned patterns”, you start one level lower, but never below Starter.</p>
          <p class="paths-rule-note">With a free account, AI can fine-tune that level and order 10 to 14 approved topics for you.</p>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function level(name, index) {
  const topics = pathLessons[name];
  const id = name.toLowerCase();
  return `<section class="paths-level" id="${id}" data-level="${id}" aria-labelledby="${id}-title">
  <div class="container paths-level-grid">
    <header class="paths-level-head" data-reveal>
      ${tag(`Level ${pad(index + 1)}`)}
      <h2 class="t-heading-lg" id="${id}-title">${name}</h2>
      <p class="paths-blurb">${e(levelBlurbs[name])}</p>
      <div class="paths-level-meta">${steps(index)}<span>${topics.length} topics · level ${index + 1} of ${levels.length}</span></div>
    </header>
    <div class="paths-trail" data-trail>
      <svg class="paths-trail-line" aria-hidden="true" focusable="false"><path class="paths-trail-bg"/><path class="paths-trail-draw"/></svg>
      <ol class="paths-stops">
        ${topics.map((topic, i) => `<li class="paths-stop" data-reveal data-reveal-delay="${(Math.floor(i / 2) * 0.05).toFixed(2)}" style="--row:${Math.floor(i / 2) + 1};--col:${Math.floor(i / 2) % 2 ? 2 - (i % 2) : 1 + (i % 2)}">
          <span class="paths-stop-dot" aria-hidden="true"></span>
          <span class="paths-stop-num">${pad(i + 1)}</span>
          <span class="paths-stop-title">${e(topic.title)}</span>
          <a class="paths-stop-src" href="${e(topic.source)}" target="_blank" rel="noopener"><span class="sr-only">Further reading for ${e(topic.title)}: </span>${e(host(topic.source))}${icon('arrow-up-right', 'icon icon-16')}</a>
        </li>`).join('')}
      </ol>
    </div>
  </div>
</section>`;
}

function keepsGoing() {
  return `<section class="section paths-more" aria-labelledby="more-title">
  <div class="container">
    <div class="panel paths-more-panel" data-reveal>
      <div class="paths-more-copy">
        ${tag('With a free account', 'tag-white')}
        <h2 class="t-heading-lg" id="more-title">The path keeps going.</h2>
        <p>When you’re close to the end of your path, AI writes the next chapter: six new lessons that pick up where you left off. Curiosity has no finish line.</p>
      </div>
      <div class="paths-more-art" aria-hidden="true">
        <div class="paths-more-card is-done">${icon('check-circle', 'icon icon-20')}<span>${e(pathLessons.Beginner[8].title)}</span></div>
        <div class="paths-more-card is-done">${icon('check-circle', 'icon icon-20')}<span>${e(pathLessons.Beginner[9].title)}</span></div>
        <div class="paths-more-card is-new">${icon('sparkle', 'icon icon-20')}<span>New chapter · 6 lessons</span>${labelMono('Ready')}</div>
      </div>
    </div>
  </div>
</section>`;
}

export default function paths() {
  const body = `
<section class="page-intro paths-intro">
  <div class="container">
    <div data-reveal>${tag('Paths')}</div>
    <h1 class="t-display" data-reveal data-reveal-delay="0.05">One winding path, four levels.</h1>
    <p class="t-lead" data-reveal data-reveal-delay="0.1">Five quick questions find where you are. Then AI puts your lessons in order, and the path keeps growing as you do.</p>
    <div class="paths-intro-actions" data-reveal data-reveal-delay="0.15">${button({ label: 'Find my path', href: SITE.signupUrl, size: 'md' })}${explore('#placement', 'How it works')}</div>
  </div>
</section>
<div class="paths-track">
<nav class="paths-switch" aria-label="Levels" data-level-switch>
  <div class="paths-switch-inner">${levels.map(name => `<a href="#${name.toLowerCase()}" data-switch="${name.toLowerCase()}">${name}</a>`).join('')}</div>
</nav>
${placement()}
<div class="paths-levels">${levels.map(level).join('')}</div>
</div>
${keepsGoing()}
<section class="cta-band" aria-labelledby="paths-cta-title">
  <div class="container cta-band-inner" data-reveal>
    <div><h2 class="t-heading-lg" id="paths-cta-title">Ready when you are.</h2><p class="cta-band-sub">Answer five questions and see where your path begins.</p></div>
    <div class="cta-band-actions">${button({ label: 'Find my path', href: SITE.signupUrl, size: 'md' })}${explore('/lessons', 'Try a free lesson')}</div>
  </div>
</section>`;
  return {
    path: '/paths',
    file: 'paths.html',
    title: 'Paths',
    description: 'Five quick questions place you at Starter, Beginner, Medium or Expert. See every topic on each level of the Fairylearn AI path.',
    current: 'learn',
    bodyClass: 'page-paths',
    scripts: ['/assets/js/paths.mjs'],
    body
  };
}
