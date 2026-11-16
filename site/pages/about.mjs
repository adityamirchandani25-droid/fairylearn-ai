// about.mjs — /about. Why Fairylearn exists and how it is made. Facts come from README.md,
// RUBRIC_AUDIT.md, public/course.mjs and public/references.html; nothing here is invented.
import { button, explore, tag, icon } from '../lib/components.mjs';
import { images, picture, freeLessons } from '../lib/site.mjs';
import { pathLessons } from '../../public/path-lessons.mjs';
import { questions, levels } from '../../public/learning.mjs';

const topicCount = Object.values(pathLessons).reduce((sum, list) => sum + list.length, 0);

const beliefs = [
  ['sparkle', 'Curiosity over pressure', 'There’s no wrong place to start. Learning AI should feel like wondering, not like a test you can fail.'],
  ['check-circle', 'Check, don’t just trust', 'A fluent answer isn’t proof. Every lesson leaves room to check claims, credit sources and notice who might be missing.'],
  ['clock', 'Your pace', 'Five minutes or thirty, your path waits for you. Small steps add up, and progress saves as you go.']
];

const made = [
  ['doc', 'Plain HTML, CSS and JavaScript', 'A small Node server and no website builder, framework or CMS.'],
  ['lock', 'Accounts with Supabase', 'Row-level security keeps each learner’s profile visible only to them.'],
  ['sparkle', 'AI with OpenAI models', 'Placement, personal lessons and the guide. The key stays on the server.'],
  ['book', 'Lessons that show their work', 'Every lesson links its main source.', '/references', 'See sources and credits'],
  ['flag', 'Made for a challenge', 'Built for the 2027–2028 TSA Webmaster challenge: an AI learning portal for grades 9–12.']
];

const stats = [
  [topicCount, 'Catalog topics'],
  [levels.length, 'Levels to grow through'],
  [freeLessons.length, 'Free essentials'],
  [questions.length, 'Questions to find your path']
];

export default function about() {
  return {
    path: '/about',
    file: 'about.html',
    title: 'About',
    description: 'Fairylearn AI makes AI feel approachable for high school students: short lessons, a path that fits, and a guide that answers back.',
    current: 'company',
    bodyClass: 'page-about',
    body: `
<section class="page-intro">
  <div class="container" data-reveal>
    ${tag('About')}
    <h1 class="t-display">Made for curious minds.</h1>
    <p class="t-lead">Fairylearn makes AI feel less like a new language and more like a path you can walk, one small step at a time. It’s built for high school students, grades 9–12.</p>
  </div>
</section>

<section class="ab-why" aria-labelledby="ab-why-title">
  <div class="container">
    <div class="media ab-image" data-reveal>${picture(images.heroWide, { sizes: '(max-width: 1200px) 100vw, 1120px' })}</div>
    <div class="ab-why-grid">
      <h2 class="t-heading-lg" id="ab-why-title" data-reveal>Why we built it</h2>
      <div class="ab-why-copy" data-reveal data-reveal-delay="0.08">
        <p>AI is showing up in homework, search and the apps you already use. Most guides either assume you know the vocabulary or try to scare you off it. We wanted something in between: short lessons, real examples, and room to ask the question you were too shy to ask in class.</p>
        <p>So Fairylearn starts with five small questions, finds your level, and lays out a path that grows with you. When something feels tricky, a patient guide explains it another way.</p>
      </div>
    </div>
  </div>
</section>

<section class="ab-believe" aria-labelledby="ab-believe-title">
  <div class="container">
    <h2 class="t-heading-lg" id="ab-believe-title" data-reveal>What we believe</h2>
    <div class="ab-cols">
      ${beliefs.map(([name, title, text], i) => `<article class="ab-col" data-reveal data-reveal-delay="${(i * 0.08).toFixed(2)}">${icon(name, 'icon icon-32')}<h3>${title}</h3><p>${text}</p></article>`).join('')}
    </div>
  </div>
</section>

<section class="ab-made" aria-labelledby="ab-made-title">
  <div class="container ab-made-grid">
    <div class="ab-made-head" data-reveal>
      <h2 class="t-heading-lg" id="ab-made-title">How it’s made</h2>
      <p>Small, honest and easy to look inside. Here’s what powers your path.</p>
      ${explore('/references', 'Sources & credits')}
    </div>
    <ul class="ab-made-list" data-reveal data-reveal-delay="0.08">
      ${made.map(([name, title, text, href, linkText]) => `<li>${icon(name)}<div><h3>${title}</h3><p>${text}${href ? ` <a class="link" href="${href}">${linkText}</a>` : ''}</p></div></li>`).join('')}
    </ul>
  </div>
</section>

<section class="ab-stats" aria-label="Fairylearn in numbers">
  <div class="container">
    <ul class="ab-stats-row">
      ${stats.map(([n, label], i) => `<li data-reveal data-reveal-delay="${(i * 0.06).toFixed(2)}"><span class="ab-stat t-tnum" data-count="${n}">${n}</span><span class="ab-stat-label">${label}</span></li>`).join('')}
    </ul>
  </div>
</section>

<section class="cta-band" aria-labelledby="ab-cta-title">
  <div class="container cta-band-inner" data-reveal>
    <div><h2 class="t-heading-lg" id="ab-cta-title">Bring a little curiosity.</h2><p class="cta-band-sub">We’ll help you find your way. Free to start, about two minutes to your path.</p></div>
    <div class="cta-band-actions">${button({ label: 'Start free', href: '/signup', size: 'md' })}${explore('/lessons', 'Try a free lesson')}</div>
  </div>
</section>`
  };
}
