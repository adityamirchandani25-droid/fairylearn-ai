// pricing.mjs — /pricing. Fairylearn has no paid plan; this page says so plainly and shows
// what an account adds. Every line here is checked against README.md and the app.
import { button, explore, tag, labelMono, icon } from '../lib/components.mjs';
import { freeLessons } from '../lib/site.mjs';

const exploreList = [
  `${freeLessons.length} free essentials, from how AI learns to using it with care`,
  'A quick quiz for every lesson, with hints and explanations',
  'A ten-question unit test across all three lessons',
  'Trophies and the item shop, saved in this browser',
  'The five questions and a preview path, saved on this device'
];
const accountList = [
  'Everything in Explore',
  'AI placement into one of four levels',
  'A saved path of lessons picked and ordered for you',
  'Personal lessons written by AI for your level',
  'New six-lesson chapters as you go',
  'An AI guide that answers back'
];

const rows = [
  ['Three free essentials', true, true],
  ['Quizzes with hints and explanations', true, true],
  ['Ten-question unit test', true, true],
  ['Trophies and item shop', true, true],
  ['Five questions and a preview path', true, true],
  ['AI placement into four levels', false, true],
  ['A saved learning path', false, true],
  ['AI-written personal lessons', false, true],
  ['New chapters as you go', false, true],
  ['The AI guide', false, true]
];

const faqs = [
  ['Is it really free?', 'Yes. There is no paid plan, no trial and nothing to unlock later. Lessons, quizzes, your path and the guide are all free.'],
  ['Do I need an account?', 'Not to start. The three essentials, quizzes and a preview path all work without one. Make a free account when you want your path saved and a guide to talk to.'],
  ['What does the AI do with my answers?', 'Your five answers help it choose your starting level and the order of your lessons. Guide chats stay in your browser’s memory, are cleared when you log out, and are sent with storage turned off.'],
  ['Can my school use it?', 'Anyone can use Fairylearn, in class or at home. There isn’t a special school plan yet, so each student makes their own free account.'],
  ['What happens to my data?', 'Your answers and path are saved to your account so they follow you. Progress, trophies and settings stay in your browser. <a class="link" href="/privacy">Read the privacy page</a> for the details.']
];

const check = `<span class="pr-check" aria-label="Included">${icon('check', 'icon icon-20')}</span>`;
const dash = '<span class="pr-dash" aria-label="Not included">—</span>';

function plan({ name, sub, list, action, featured }) {
  return `<article class="pr-plan${featured ? ' is-featured' : ''}" data-reveal${featured ? ' data-reveal-delay="0.08"' : ''}>
    <header class="pr-plan-head"><h2 class="t-subheading">${name}</h2>${labelMono('Free')}</header>
    <p class="pr-price"><span class="pr-amount t-tnum">$0</span><span class="pr-per">${sub}</span></p>
    <ul class="pr-list">${list.map(item => `<li>${icon('check', 'icon icon-20')}<span>${item}</span></li>`).join('')}</ul>
    <div class="pr-action">${action}</div>
  </article>`;
}

export default function pricing() {
  return {
    path: '/pricing',
    file: 'pricing.html',
    title: 'Pricing',
    description: 'Fairylearn AI is free. Lessons, quizzes, your learning path and the AI guide cost nothing. You only need a free account to save your path.',
    current: 'pricing',
    bodyClass: 'page-pricing',
    body: `
<section class="page-intro center">
  <div class="container" data-reveal>
    ${tag('Pricing')}
    <h1 class="t-display">Free. Really.</h1>
    <p class="t-lead">Everything here is free. You only need an account to save your path and meet your guide.</p>
  </div>
</section>

<section class="pr-plans-wrap" aria-label="Plans">
  <div class="container pr-plans">
    ${plan({ name: 'Explore', sub: 'No account needed', list: exploreList, action: explore('/lessons', 'Start a lesson') })}
    ${plan({ name: 'Free account', sub: 'Free, for as long as you learn', list: accountList, action: button({ label: 'Start free', href: '/signup', size: 'md', className: 'btn-block' }), featured: true })}
  </div>
  <p class="container pr-note" data-reveal>No paid plan, no trial, no card. Nothing is held back for later.</p>
</section>

<section class="pr-compare" aria-labelledby="pr-compare-title">
  <div class="container">
    <h2 class="t-heading-lg" id="pr-compare-title" data-reveal>What an account adds</h2>
    <div class="pr-table-scroll" data-reveal>
      <table class="pr-table">
        <thead><tr><th scope="col"><span class="sr-only">Feature</span></th><th scope="col">Explore</th><th scope="col">Free account</th></tr></thead>
        <tbody>${rows.map(([label, a, b]) => `<tr><th scope="row">${label}</th><td>${a ? check : dash}</td><td>${b ? check : dash}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>
</section>

<section class="pr-faq" aria-labelledby="pr-faq-title">
  <div class="container pr-faq-grid">
    <div data-reveal>
      <h2 class="t-heading-lg" id="pr-faq-title">Questions, answered</h2>
      <p class="pr-faq-sub">Still wondering? Peek at a lesson first. It’s the quickest way to see if Fairylearn feels like you.</p>
    </div>
    <div class="pr-faq-list" data-reveal>
      ${faqs.map(([q, a], i) => `<details class="pr-faq-item" name="pr-faq"${i === 0 ? ' open' : ''}><summary>${icon('question')}<span>${q}</span>${icon('plus', 'icon icon-20 pr-faq-toggle')}</summary><div class="pr-faq-body"><p>${a}</p></div></details>`).join('')}
    </div>
  </div>
</section>

<section class="cta-band" aria-labelledby="pr-cta-title">
  <div class="container cta-band-inner" data-reveal>
    <div><h2 class="t-heading-lg" id="pr-cta-title">Start with a little hello.</h2><p class="cta-band-sub">About two minutes to find your path. No card, nothing to cancel.</p></div>
    <div class="cta-band-actions">${button({ label: 'Start free', href: '/signup', size: 'md' })}${explore('/lessons', 'Try a free lesson')}</div>
  </div>
</section>`
  };
}
