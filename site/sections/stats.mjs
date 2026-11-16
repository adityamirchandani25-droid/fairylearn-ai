// stats.mjs — headline, three oversized honest stats and three icon columns split by hairlines
// (the "Agents collect the evidence" block on the reference).
import { icon } from '../lib/components.mjs';

const stats = [
  { value: 3, label: 'Free essentials' },
  { value: 4, label: 'Levels to grow through' },
  { value: 2, unit: ' min', label: 'About 2 minutes to start' }
];

const columns = [
  { icon: 'compass', title: 'Start where you are', text: 'Five quick questions find your level, from brand new to ready for more.' },
  { icon: 'steps', title: 'Learn in small steps', text: 'Short lessons, real examples and a quick check at the end of each one.' },
  { icon: 'message', title: 'Practice with a guide', text: 'Hints before answers, and a patient AI guide whenever a lesson feels tricky.' }
];

export default function statsSection() {
  return `<section class="stats" aria-labelledby="stats-title">
  <div class="container">
    <h2 class="t-heading-lg stats-title" id="stats-title" data-reveal>Lessons do the explaining. <br>You do the wondering.</h2>
    <dl class="stats-row">${stats.map((stat, i) => `
      <div class="stat" data-reveal data-reveal-delay="${(0.08 * (i + 1)).toFixed(2)}">
        <dt class="stat-label">${stat.label}</dt>
        <dd class="stat-value"><span data-count="${stat.value}">${stat.value}</span>${stat.unit ? `<span class="stat-unit">${stat.unit}</span>` : ''}</dd>
      </div>`).join('')}
    </dl>
    <hr class="hairline stats-rule">
    <ul class="stats-cols">${columns.map((col, i) => `
      <li class="stats-col" data-reveal data-reveal-delay="${(0.08 * i).toFixed(2)}">
        ${icon(col.icon, 'icon icon-32')}
        <h3 class="stats-col-title">${col.title}</h3>
        <p class="stats-col-text">${col.text}</p>
      </li>`).join('')}
    </ul>
  </div>
</section>`;
}
