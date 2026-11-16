// legal.mjs — /privacy, /terms and the 404 page. The policy text describes what the code in
// this repository actually does (server.mjs, public/auth.mjs, public/app.mjs, ai-learning.mjs,
// supabase/schema.sql). Update it whenever data handling changes.
import { tag, labelMono, button, icon } from '../lib/components.mjs';
import { lessonImage, picture, escapeHtml as e } from '../lib/site.mjs';

export const UPDATED = 'Last updated October 28, 2026';

const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Shared by /privacy, /terms and /references: intro, optional summary card, then a sticky
// table of contents beside numbered sections.
export function legalPage({ path, file, tagLabel, title, lead, summary, sections, description, bodyClass = 'page-legal', updated = UPDATED, note = 'This is a plain-language policy written for students and families. It is not legal advice.' }) {
  const toc = sections.map((section, i) => `<li><a href="#${slug(section.title)}" data-toc-link><span class="legal-toc-num">${String(i + 1).padStart(2, '0')}</span>${e(section.title)}</a></li>`).join('');
  const doc = sections.map((section, i) => `<section class="legal-section" id="${slug(section.title)}" data-legal-section><h2 class="t-heading"><span class="legal-num">${String(i + 1).padStart(2, '0')}</span>${e(section.title)}</h2>${section.body}</section>`).join('');
  return {
    path, file, current: 'resources', bodyClass, title: tagLabel, description,
    scripts: ['/assets/js/legal.mjs'],
    body: `<section class="page-intro"><div class="container">
  <div data-reveal>${tag(tagLabel)}</div>
  <h1 class="t-heading-lg" data-reveal data-reveal-delay="0.05">${title}</h1>
  <p class="t-lead" data-reveal data-reveal-delay="0.1">${lead}</p>
  <div class="legal-updated" data-reveal data-reveal-delay="0.15">${labelMono(updated, true)}</div>
  ${summary ? `<div class="card legal-summary" data-reveal data-reveal-delay="0.2"><h2 class="t-subheading">The short version</h2><ul>${summary.map(line => `<li>${icon('check', 'icon icon-20')}<span>${line}</span></li>`).join('')}</ul></div>` : ''}
</div></section>
<section class="legal-body"><div class="container legal-grid">
  <nav class="legal-toc" aria-label="On this page"><p class="legal-toc-label">On this page</p><ol>${toc}</ol></nav>
  <article class="legal-doc">${doc}${note ? `<p class="legal-note">${note}</p>` : ''}</article>
</div></section>`
  };
}

const p = text => `<p>${text}</p>`;
const ul = items => `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;

const privacy = legalPage({
  path: '/privacy', file: 'privacy.html', tagLabel: 'Privacy',
  title: 'What we keep, and why.',
  lead: 'Fairylearn keeps as little as it can. Here is exactly what is stored, where it lives and who sees it.',
  description: 'How Fairylearn AI handles your account, learning answers, progress and AI conversations, in plain language.',
  summary: [
    'You can try the free lessons and quizzes without an account. That progress stays in your browser.',
    'With an account we store your email, your name and your learning answers, so your path is saved.',
    'Your answers and questions are sent to OpenAI to build your path, write lessons and power your guide.',
    'No ads, no analytics, no tracking cookies.'
  ],
  sections: [
    { title: 'Using Fairylearn without an account', body: p('You can read the three free lessons, take their quizzes and preview a learning path without signing up. Everything you do there is saved only in your browser’s local storage on this device: lesson progress, best quiz scores, trophies and items, your study journal, your theme, and your preview answers. We never receive it.') + p('Clearing your browser’s site data for Fairylearn removes all of it.') },
    { title: 'What we store when you create an account', body: p('Accounts are handled by Supabase Auth. When you sign up, Supabase stores:') + ul(['your email address', 'your password, which Supabase keeps in hashed form (we never see it)', 'the name you tell us to call you']) + p('After you answer the five questions, we save one learning profile for you: your answers, your starting level, a short description of your path and the lessons in it, and when it was last updated.') + p('The database checks every request, so a learner can only ever read or change their own profile.') },
    { title: 'How AI is used', body: p('When AI features are switched on, our server sends some information to OpenAI:') + ul(['your five answers and the lesson catalog, to choose your starting level and lessons', 'your answers and a lesson topic, to write a personal lesson', 'your recent guide conversation (up to ten short messages), your answers, your level and the current lesson title, to reply as your guide']) + p('Requests ask OpenAI not to store the conversation. Your email and password are never sent to OpenAI.') + p('Your guide conversation is not saved by Fairylearn. It lives in the open page and disappears when you leave. Generated lessons are kept in the server’s memory for up to 24 hours so reopening one is instant, and are cleared when the server restarts.') },
    { title: 'What stays on your device', body: p('Some things are always kept in your browser, even with an account:') + ul(['your sign-in session, so you stay logged in across tabs', 'lesson progress, quiz scores, trophies and your study journal', 'your theme and this storage notice choice']) + p('Logging out removes your sign-in session from this browser. Progress saved in the browser stays until you clear the site’s data.') },
    { title: 'Cookies, ads and tracking', body: p('Fairylearn does not show ads, does not use analytics or tracking cookies and does not sell or share your information. We use your browser’s local storage only for the things listed above.') },
    { title: 'Safety limits', body: p('To keep the service fair and protect against abuse, the server counts requests per network address and per account for a short time, for example how many lessons or guide messages you asked for this hour. These counts are kept in memory and are not linked to anything else.') },
    { title: 'Students and age', body: p('Fairylearn is made for high school students, grades 9 to 12. If you are under 13, please don’t create an account on your own. Ask a parent or guardian first; you can still explore the free lessons without one.') },
    { title: 'Deleting your data', body: p('To remove everything kept on your device, clear the site data for Fairylearn in your browser settings.') + p('To delete your account, contact the site owner. When an account is deleted, its learning profile is deleted with it automatically.') },
    { title: 'Changes to this policy', body: p('If the way Fairylearn handles information changes, we will update this page and the date at the top.') }
  ]
});

const terms = legalPage({
  path: '/terms', file: 'terms.html', tagLabel: 'Terms',
  title: 'The simple rules.',
  lead: 'A few plain rules for learning with Fairylearn, so it stays kind, safe and useful for everyone.',
  description: 'The plain-language terms for using Fairylearn AI: fair use, AI limits, credits and changes.',
  summary: [
    'Use Fairylearn to learn, and be kind to the service and to others.',
    'AI can make mistakes. Check important facts with a trusted source.',
    'The free lessons stay free. There is nothing to buy.',
    'Lessons credit their sources. You keep what you write.'
  ],
  sections: [
    { title: 'Using Fairylearn', body: p('Fairylearn is a learning space for curious high school students. By using it you agree to these rules and to our <a class="link" href="/privacy">privacy policy</a>. If you are under 13, ask a parent or guardian before creating an account.') },
    { title: 'Your account', body: p('Keep your password to yourself and use an email address you can open, so you can confirm your account. You are responsible for what happens under your account. You can stop using Fairylearn at any time.') },
    { title: 'Fair and kind use', body: p('Please don’t:') + ul(['try to break, overload or get around the service’s limits', 'use the guide to create harmful, hateful or dishonest content', 'share other people’s private information, passwords or schoolwork', 'pretend to be someone else']) + p('We may pause accounts or requests that break these rules.') },
    { title: 'AI can make mistakes', body: p('Personal lessons, paths and guide replies are written by AI. They can be wrong, out of date or incomplete, even when they sound confident. Treat them as a starting point, check important facts with a reliable source and follow your school’s rules about using AI for assignments.') },
    { title: 'Content and credits', body: p('Lesson text is original to Fairylearn, and the sources behind it are listed on the <a class="link" href="/references.html">sources and credits</a> page. Your answers, notes and messages are yours.') },
    { title: 'Free to use', body: p('The free lessons, quizzes and learning paths cost nothing. AI features depend on the service being configured and can be limited per hour so they stay available for everyone.') },
    { title: 'No warranty', body: p('Fairylearn is offered as it is, without guarantees that it will always be available, error-free or right for a particular purpose. As far as the law allows, we are not responsible for losses that come from using it.') },
    { title: 'Changes', body: p('We may update these terms as Fairylearn grows. When we do, we will change the date at the top of this page. Using Fairylearn after a change means you accept the new terms.') }
  ]
});

const notFound = {
  path: '/404', file: '404.html', bodyClass: 'page-404', title: 'Page not found',
  description: 'This page could not be found.',
  body: `<section class="nf"><div class="container nf-inner">
  <div class="nf-art" data-reveal>${picture(lessonImage.tools, { loading: 'eager', alt: '' })}</div>
  <p class="nf-code" data-reveal data-reveal-delay="0.05">${labelMono('404', true)}</p>
  <h1 class="t-heading-lg" data-reveal data-reveal-delay="0.1">This path wandered off.</h1>
  <p class="t-lead" data-reveal data-reveal-delay="0.15">The page you were looking for isn’t here. Let’s get you back on a path that goes somewhere.</p>
  <div class="nf-actions" data-reveal data-reveal-delay="0.2">${button({ label: 'Back home', href: '/', size: 'md' })}${button({ label: 'Browse lessons', href: '/lessons', variant: 'outline', chev: true })}</div>
</div></section>`
};

export default () => [privacy, terms, notFound];
