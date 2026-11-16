// free.mjs — "Free to start": the full-bleed band in the live site's "Safe and secure" slot,
// mirrored on purpose: the three seals sit on the left and the copy column on the right,
// with two actions instead of one.
import { button, explore, seal } from '../lib/components.mjs';

const ring = '<svg class="free-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="57"/></svg>';

export default function free() {
  const seals = [['3', 'free lessons'], ['0', 'ads'], ['~2', 'minutes to start']];
  return `<section class="free" aria-labelledby="free-title">
  <div class="container free-inner">
    <ul class="free-seals" aria-label="What free means">
      ${seals.map(([big, small], i) => `<li class="free-seal" data-reveal data-reveal-delay="${(i * 0.08).toFixed(2)}">${ring}${seal(big, small)}</li>`).join('')}
    </ul>
    <div class="free-copy" data-reveal>
      <h2 class="t-heading-lg" id="free-title">Free to start</h2>
      <p class="free-text">Three essentials, quizzes and a peek at your path, no account needed. Create a free account to save your path and meet your guide.</p>
      <div class="free-actions">${button({ label: 'Start free', href: '/signup', size: 'md' })}${explore('/pricing', 'See what’s free')}</div>
    </div>
  </div>
</section>`;
}
