// samples.mjs — "Sample lessons": the live site's three story cards, made from the three free
// lessons in public/course.mjs (title, time, quiz length and category are real).
import { explore, labelMono } from '../lib/components.mjs';
import { freeLessons, lessonImage, picture, escapeHtml as e } from '../lib/site.mjs';

const sentenceCase = text => { const lower = text.toLowerCase().replace(/\bai\b/g, 'AI'); return lower.charAt(0).toUpperCase() + lower.slice(1); };

export default function samples() {
  return `<section class="samples" aria-labelledby="samples-title">
  <div class="container">
    <header class="samples-head" data-reveal>
      <h2 class="t-heading-md" id="samples-title">Sample lessons</h2>
      ${explore('/lessons', 'All lessons')}
    </header>
    <ul class="samples-grid">
      ${freeLessons.map((lesson, i) => `<li data-reveal data-reveal-delay="${(i * 0.08).toFixed(2)}"><a class="sample" href="${lesson.url}">
        <span class="sample-media">${picture(lessonImage[lesson.id], { sizes: '(max-width: 767px) 80vw, 360px', alt: '' })}<span class="sample-tag">${e(sentenceCase(lesson.category))}</span></span>
        <span class="sample-title">${e(lesson.title)}</span>
        <span class="sample-meta"><span class="meta">${e(lesson.time)} · ${lesson.quiz.length}-question quiz</span>${labelMono('Free')}</span>
      </a></li>`).join('')}
    </ul>
  </div>
</section>`;
}
