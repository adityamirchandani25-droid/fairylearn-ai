// levels.mjs — the level strip (where the reference shows its grayscale logo bar): the four
// Fairylearn levels as monochrome wordmarks in one still row, then the hairline that opens
// the stats section.
import { levelBlurbs } from '../lib/site.mjs';

const glyphs = {
  Starter: '<path d="M12 21v-8.5"/><path d="M12 12.5c0-4.2-2.6-6.8-7.2-6.8 0 4.2 2.6 6.8 7.2 6.8Z"/><path d="M12 15c0-3.6 2.3-5.7 6.7-5.7 0 3.6-2.3 5.7-6.7 5.7Z"/>',
  Beginner: '<path d="M12 2.5c.8 5.6 3 7.9 8.5 8.7-5.5.8-7.7 3-8.5 8.6-.8-5.6-3-7.8-8.5-8.6 5.5-.8 7.7-3.1 8.5-8.7Z"/>',
  Medium: '<path d="M3 20.5h5.5V15H14V9.5h5.5V4H21"/><circle cx="3" cy="20.5" r=".6"/>',
  Expert: '<path d="m2 20.5 7.2-12.2 4.1 6.7 2.6-3.6L21.8 20.5z"/><path d="M9.2 8.3V2.8l4.2 1.6-4.2 1.6"/>'
};

const wordmark = level => `<li><a class="level-mark" href="/paths#${level.toLowerCase()}" title="${levelBlurbs[level]}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${glyphs[level]}</svg><span>${level}</span></a></li>`;

export default function levels() {
  return `<section class="levels" aria-labelledby="levels-label">
  <p class="levels-label" id="levels-label">Four levels. Start wherever you are.</p>
  <ul class="levels-row">${Object.keys(levelBlurbs).map(wordmark).join('')}</ul>
  <div class="container"><hr class="hairline levels-rule"></div>
</section>`;
}
