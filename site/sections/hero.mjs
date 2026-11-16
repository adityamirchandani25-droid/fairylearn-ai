// hero.mjs — the landing hero: a full-bleed watercolor painting that fades into the canvas,
// with the announcement pill, display headline, subtext and the hero action stacked at the
// bottom (measured from the live reference: 855px tall at 1440, painting 804px).
import { pillGlass, button } from '../lib/components.mjs';
import { images, escapeHtml } from '../lib/site.mjs';

export default function hero() {
  const { heroWide: wide, heroTall: tall } = images;
  return `<section class="hero" aria-labelledby="hero-title">
  <div class="hero-art">
    <picture>
      <source media="(max-width: 767px)" srcset="${tall.src}" width="${tall.width}" height="${tall.height}">
      <img class="hero-img" src="${wide.src}" width="${wide.width}" height="${wide.height}" alt="${escapeHtml(wide.alt)}" loading="eager" decoding="async" fetchpriority="high">
    </picture>
  </div>
  <div class="hero-content">
    ${pillGlass('Every free lesson ends with a quiz', '/quiz')}
    <h1 class="t-display hero-title" id="hero-title">A little curiosity goes a long way</h1>
    <p class="hero-sub">Fairylearn finds where you are, then lays out a gentle path of short AI lessons, quizzes and a guide that answers back.</p>
    ${button({ label: 'Find my path', href: '/signup', size: 'hero' })}
  </div>
</section>`;
}
