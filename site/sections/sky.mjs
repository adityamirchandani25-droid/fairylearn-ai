// sky.mjs — the full-bleed watercolor sky band with a glass chip, white heading and a white pill.
import { chipGlass, button } from '../lib/components.mjs';
import { picture, images } from '../lib/site.mjs';

export default function sky() {
  return `<section class="sky" aria-labelledby="sky-title">
  <div class="sky-art" aria-hidden="true" data-sky-parallax>${picture(images.sky, { alt: '', className: 'sky-img' })}</div>
  <div class="sky-inner">
    <div data-reveal>${chipGlass('AI guide')}</div>
    <h2 class="sky-title" id="sky-title" data-reveal data-reveal-delay="0.06">A guide that answers back.</h2>
    <p class="sky-text" data-reveal data-reveal-delay="0.12">Stuck on a lesson? Ask in your own words. Your guide explains it another way, offers a hint before the answer, and never asks for personal details.</p>
    <div class="sky-action" data-reveal data-reveal-delay="0.18">${button({ label: 'Meet your guide', href: '/lessons#guide', variant: 'white', chev: true })}</div>
  </div>
</section>`;
}
