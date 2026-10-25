import { questions, levels, getLevel, validAnswers, planDescription } from './learning.mjs';
import { attachMotion, logoMarkup, startLoading } from './motion.mjs';

const app = document.querySelector('#app');
let theme = read('fairylearn-theme') === 'night' ? 'night' : 'day';
document.documentElement.dataset.theme = theme;
attachMotion(app);
const stopInitialLoading = startLoading('Opening your next chapter…');
const config = await fetch('/api/config').then(r => r.json()).catch(() => ({}));
let session = null;
let answers = {};
let step = 0;
let name = '';
let currentView = 'home';
let selectedLevel;
let description = '';
let busy = false;
const configured = !!(config.supabaseUrl && config.supabaseAnonKey);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const star = logoMarkup('brand-logo');
function themeIcon() {
  return theme === 'day'
    ? '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M23.5 24.5A11 11 0 0 1 16 4a10 10 0 1 0 7.5 20.5Z"/><path d="m24 4 .7 2.3L27 7l-2.3.7L24 10l-.7-2.3L21 7l2.3-.7L24 4Zm4 9 .4 1.6L30 15l-1.6.4L28 17l-.4-1.6L26 15l1.6-.4L28 13Z"/></svg>'
    : '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="6"/><path d="M16 2v4m0 20v4M2 16h4m20 0h4M6.2 6.2 9 9m14 14 2.8 2.8M25.8 6.2 23 9M9 23l-2.8 2.8"/><path d="m27 2 .5 1.5L29 4l-1.5.5L27 6l-.5-1.5L25 4l1.5-.5L27 2Z"/></svg>';
}
function themeButton() {
  return `<button class="theme-toggle" type="button" data-action="theme" aria-label="Switch to ${theme === 'day' ? 'night' : 'day'} mode" title="Switch to ${theme === 'day' ? 'night' : 'day'} mode">${themeIcon()}<span class="theme-sparkle" aria-hidden="true">✦</span></button>`;
}
function toggleTheme() {
  theme = theme === 'day' ? 'night' : 'day';
  document.documentElement.dataset.theme = theme;
  store('fairylearn-theme', theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'night' ? '#171b23' : '#f9f8f3');
  app.querySelectorAll('.theme-toggle').forEach(button => {
    button.innerHTML = `${themeIcon()}<span class="theme-sparkle" aria-hidden="true">✦</span>`;
    button.setAttribute('aria-label', `Switch to ${theme === 'day' ? 'night' : 'day'} mode`);
    button.title = `Switch to ${theme === 'day' ? 'night' : 'day'} mode`;
  });
}
function toast(text) { const el = document.querySelector('#toast'); el.textContent = text; el.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 4200); }
function header(simple = false) { return `<header class="header"><a class="brand" href="#" data-action="home">${star}<span>fairylearn<span class="brand-ai">AI</span></span></a>${simple ? `<div class="simple-header-actions"><span class="header-note">Your next chapter starts here.</span>${themeButton()}</div>` : `<nav aria-label="Main navigation"><a href="#how-it-works" data-action="how">How it works</a><a href="#paths" data-action="paths">Learning paths</a></nav><div class="header-actions">${themeButton()}${session ? '<button class="text-button" data-action="dashboard">My path ↗</button><button class="text-button" data-action="logout">Log out</button>' : '<button class="text-button" data-action="login">Log in</button><button class="button small dark" data-action="signup">Get started <span>↗</span></button>'}</div>`}</header>`; }
function footer() { return `<footer><a class="brand" href="#" data-action="home">${star}<span>fairylearn<span class="brand-ai">AI</span></span></a><p>A little curiosity goes a long way.</p><span>Made for human potential. ✧</span></footer>`; }
function illustration() { return `<div class="illustration" aria-label="An illustrated winding path through a world of AI discoveries" role="img"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><div class="sky-star s1">✧</div><div class="sky-star s2">✦</div><div class="sky-star s3">✧</div><div class="sky-star s4">+</div><div class="float-tag tag-top"><i class="dot"></i> A path that’s uniquely yours</div><svg class="journey-svg" viewBox="0 0 520 440" fill="none" aria-hidden="true"><path d="M80 410C65 325 390 373 382 283C376 215 148 283 159 190C166 131 318 166 319 80" stroke="#e4e1d6" stroke-width="56"/><path d="M80 410C65 325 390 373 382 283C376 215 148 283 159 190C166 131 318 166 319 80" stroke="#fffdf7" stroke-width="44"/><path d="M80 410C65 325 390 373 382 283C376 215 148 283 159 190C166 131 318 166 319 80" stroke="#c4bcd5" stroke-width="2" stroke-dasharray="7 9"/><ellipse cx="319" cy="82" rx="32" ry="11" fill="#c3b6e0"/><path d="M319 80V20" stroke="#655784" stroke-width="3"/><path d="M321 21L355 30L321 43Z" fill="#9678c0"/></svg><div class="world-card card-spark"><span>✦</span><small>BIG IDEAS</small></div><div class="world-card card-book"><span>▤</span><small>SMALL STEPS</small></div><div class="world-card card-bot"><span class="robot"><i></i><i></i></span><small>YOUR AI GUIDE</small></div><div class="plant plant-one">✳</div><div class="plant plant-two">✳</div><div class="float-tag tag-bottom"><span>✧</span> A little wiser, every day.</div></div>`; }
function home() {
  currentView = 'home';
  app.innerHTML = `${header()}<main><section class="hero"><div class="hero-copy"><div class="eyebrow"><span></span> A LITTLE CURIOSITY. A WORLD OF POSSIBILITY.</div><h1>Big world of AI.<br>Your own <em>little<br>way in.</em><span class="title-star">✧</span></h1><p>AI doesn’t have to feel like another language.<br class="desktop-break"> Find your starting point, follow your curiosity, and learn<br class="desktop-break"> at a pace that feels like you.</p><div class="hero-actions"><button class="button purple" data-action="signup">Find my learning path <span>↗</span></button><span class="hero-caption">No experience needed.<br>Just a little wonder.</span></div><button class="demo-link" data-action="demo">Take a peek without an account <span>→</span></button></div>${illustration()}</section><div class="value-strip"><span><i>✧</i> Built around you</span><span><i>◷</i> Your pace, your progress</span><span><i>♧</i> From curious to confident</span><span><i>✳</i> A little help from AI</span></div><section class="how-section" id="how-it-works"><div class="section-intro"><div><div class="eyebrow">A PATH, NOT A LEAP</div><h2>Every great journey starts<br>with a little <em>hello.</em></h2></div><p>You bring the curiosity.<br>We’ll help you find your way.</p></div><div class="steps-grid"><article><span class="step-number">01 /</span><div class="step-icon lavender">☷</div><h3>Tell us a little about you</h3><p>A few quick questions about what you know, what you love, and where you want to go.</p><span class="mini-note">ABOUT 2 MINUTES</span></article><article><span class="step-number">02 /</span><div class="step-icon peach">⌁</div><h3>Find your starting point</h3><p>Get a personal learning path that fits your experience, goals, and everyday life.</p><span class="mini-note">MADE FOR YOU</span></article><article><span class="step-number">03 /</span><div class="step-icon sage">✧</div><h3>Grow one discovery at a time</h3><p>Your path is just the beginning. Lessons, slides, and a helpful AI guide are coming next.</p><span class="mini-note">SOMETHING TO LOOK FORWARD TO</span></article></div></section><section class="paths-section" id="paths"><div class="eyebrow">EVERY STARTING POINT BELONGS</div><h2>A little room for <em>everyone.</em></h2><p>Brand-new to AI or ready to go deeper? There’s a path for you.</p><div class="level-preview">${levels.map((level, i) => `<div><span class="level-glyph">${['·', '✧', '✳', '✺'][i]}</span><h3>${level}</h3><p>${['Start with the very basics.', 'Turn curiosity into confidence.', 'Put your knowledge to work.', 'Explore what’s possible next.'][i]}</p></div>`).join('')}</div><button class="button dark" data-action="signup">Let’s find your path <span>↗</span></button></section></main>${footer()}`;
}
function auth(mode = 'signup') {
  currentView = mode;
  const signup = mode === 'signup';
  app.innerHTML = `${header(true)}<main class="auth-layout"><aside class="auth-aside"><div class="eyebrow">YOUR CURIOSITY LOOKS GOOD ON YOU</div><h1>A small start.<br><em>Endless possibility.</em></h1><p>A learning experience shaped around your goals,<br>your pace, and your own kind of curious.</p>${illustration()}</aside><section class="auth-panel"><button class="back-link" data-action="home">← Back to home</button><div class="auth-icon">✧</div><h2>${signup ? 'Let’s begin your story.' : 'Welcome back, curious mind.'}</h2><p>${signup ? 'Create your account, then find your path.' : 'Your next little discovery is waiting.'}</p>${!configured ? '<div class="notice">Account setup is coming soon. You can explore the full questionnaire and preview your path below.</div>' : ''}<form id="auth-form" data-mode="${mode}">${signup ? '<label>Your name<input name="name" autocomplete="given-name" placeholder="What should we call you?" maxlength="60" required></label>' : ''}<label>Email address<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label><label>Password<input name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="8" maxlength="128" placeholder="${signup ? 'At least 8 characters' : 'Enter your password'}" required></label><p class="form-error" id="form-error" role="alert"></p><button class="button purple full" type="submit" ${!configured ? 'disabled' : ''}>${signup ? 'Create my account' : 'Log in'} <span>↗</span></button></form><p class="auth-switch">${signup ? 'Already have an account?' : 'New to Fairylearn?'} <button class="inline-button" data-action="${signup ? 'login' : 'signup'}">${signup ? 'Log in' : 'Create an account'}</button></p><div class="divider"><span>or follow your curiosity</span></div><button class="button outline full" data-action="demo">Explore without an account <span>→</span></button><p class="privacy-note">✧ Your answers help shape your path. Preview answers stay on this device.</p></section></main>${footer()}`;
}
const fairyTips = {
  experience: 'Tell me how familiar AI feels right now. This helps me pick a comfortable starting point, and you can explore every level later.',
  knowledge: 'This quick check helps me understand what you already know. It is only for placing your starting point, not a grade.',
  goal: 'Your goal gives your path a direction. Pick what sounds most exciting today; you can explore other topics later.',
  format: 'This tells me what kind of explanations feel easiest to follow, from visual overviews to hands-on examples.',
  pace: 'A little learning can go a long way. Choose a daily time that feels realistic for you.'
};
let fairyButton;
let fairyFlight;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function closeFairyTip() {
  const tip = app.querySelector('#fairy-tip');
  if (tip) tip.hidden = true;
  fairyButton?.setAttribute('aria-expanded', 'false');
}
function questionnaire() {
  currentView = 'questions';
  const q = questions[step];
  const previousPosition = fairyButton?.isConnected ? fairyButton.getBoundingClientRect() : null;
  fairyFlight?.cancel();
  app.innerHTML = `${header(true)}<main class="onboarding"><div class="onboarding-intro"><div class="eyebrow">A PATH THAT FEELS LIKE YOU</div><h2>First, a little <em>getting to know you.</em></h2><p>Five small questions. A whole world to discover.</p><div class="question-dots" role="group" aria-label="Question progress">${questions.map((item, i) => `<span class="question-dot ${answers[item.id] ? 'answered' : ''} ${i === step ? 'current' : ''}" data-dot="${item.id}" role="img" aria-label="Question ${i + 1}: ${answers[item.id] ? 'answered' : i === step ? 'current' : 'not answered'}"></span>`).join('')}</div><span class="question-count" aria-live="polite">Question ${step + 1} of ${questions.length}</span></div><section class="question-card fairy-corner-${step}" aria-labelledby="question-title"><div class="question-card-content"><div class="question-topline"><span class="question-kicker">QUESTION 0${step + 1}</span><span>0${step + 1} / 0${questions.length}</span></div><h1 tabindex="-1" id="question-title">${q.title}</h1><p class="question-subtitle">${q.subtitle}</p><div class="options" role="radiogroup" aria-labelledby="question-title">${q.options.map(([value, title, subtitle, icon]) => `<button class="option ${answers[q.id] === value ? 'selected' : ''}" role="radio" aria-checked="${answers[q.id] === value}" data-option="${value}"><span class="option-icon">${icon}</span><span><strong>${title}</strong><small>${subtitle}</small></span><span class="radio-mark"></span></button>`).join('')}</div><div class="question-controls"><button class="back-link" data-action="previous">← ${step ? 'Back' : 'Home'}</button><span class="save-label">${session ? 'Saved when you finish' : 'Preview • no account needed'}</span><button class="button purple" data-action="next" ${!answers[q.id] ? 'disabled' : ''}>${step === 4 ? 'Find my path' : 'Continue'} <span>→</span></button></div></div><aside id="fairy-tip" class="fairy-tip" role="region" aria-label="About this question" hidden><div class="fairy-tip-heading"><span>✧ A note from your fairy</span><button type="button" data-action="close-tip" aria-label="Close fairy tip">×</button></div><p>${fairyTips[q.id]}</p></aside></section></main>`;
  if (!fairyButton) {
    fairyButton = document.createElement('button');
    fairyButton.type = 'button';
    fairyButton.className = 'fairy-guide';
    fairyButton.dataset.action = 'fairy-tip';
    fairyButton.setAttribute('aria-label', 'Ask the fairy about this question');
    fairyButton.setAttribute('aria-controls', 'fairy-tip');
    fairyButton.innerHTML = `<span class="fairy-halo"></span>${logoMarkup('fairy-logo')}<span class="fairy-sparkle" aria-hidden="true">✧</span>`;
  }
  fairyButton.setAttribute('aria-expanded', 'false');
  const card = app.querySelector('.question-card');
  card.append(fairyButton);
  if (previousPosition) {
    // Keep the active question in view after Continue or Back, including on mobile.
    window.scrollTo({ top: window.scrollY + card.getBoundingClientRect().top - 22, behavior: 'instant' });
  } else window.scrollTo(0, 0);
  if (previousPosition && !reducedMotion.matches && fairyButton.animate) {
    const nextPosition = fairyButton.getBoundingClientRect();
    fairyFlight = fairyButton.animate([
      { transform: `translate(${previousPosition.left - nextPosition.left}px, ${previousPosition.top - nextPosition.top}px) rotate(-9deg) scale(.92)` },
      { transform: 'translate(0, 0) rotate(0) scale(1)' }
    ], { duration: 780, easing: 'cubic-bezier(.2,.82,.2,1)' });
  }
}
const modules = {
  Starter: ['Hello, artificial intelligence', 'AI in your everyday world', 'Your first conversation with AI'],
  Beginner: ['A closer look at generative AI', 'The art of a good prompt', 'Using AI thoughtfully'],
  Medium: ['From simple prompts to workflows', 'Understanding how models learn', 'Checking facts, bias, and limitations'],
  Expert: ['Inside modern language models', 'Building with models and APIs', 'Evaluating responsible AI systems']
};
function dashboard() {
  currentView = 'dashboard';
  const assigned = getLevel(answers);
  selectedLevel ||= assigned;
  app.innerHTML = `${header()}<main class="dashboard"><div class="dashboard-greeting"><div><div class="eyebrow">YOUR NEXT CHAPTER</div><h1>A little curiosity.<br><em>A path of your own.</em></h1><p>${name ? `Welcome, ${escape(name)}. ` : ''}Here’s where your AI adventure begins.</p></div><div class="path-badge"><span>✧</span><small>YOUR STARTING POINT</small><strong>${assigned}</strong></div></div>${!session ? '<div class="preview-notice"><span>✧ You’re exploring a preview. Your answers are saved in this browser.</span><button class="inline-button" data-action="signup">Create an account →</button></div>' : ''}<section class="personal-plan"><span class="plan-icon">✳</span><div><div class="eyebrow">A LITTLE PLAN, JUST FOR YOU</div><p>${escape(description || planDescription(answers))}</p><div class="plan-tags"><span>◷ ${answers.pace === '30' ? '30+' : answers.pace} min / day</span><span>◇ ${({ visual: 'Visual learning', practical: 'Hands-on learning', guided: 'Step by step', mixed: 'A little of everything' })[answers.format]}</span></div></div><button class="back-link" data-action="retake">Edit my answers ↗</button></section><div class="curriculum-heading"><div><h2>Your learning path</h2><p>Explore every level, starting wherever feels right.</p></div><span class="coming-pill">✧ LESSONS ARE ON THEIR WAY</span></div><div class="level-tabs" role="tablist" aria-label="Learning levels">${levels.map((level, i) => `<button role="tab" id="tab-${level}" aria-controls="lesson-panel" aria-selected="${selectedLevel === level}" data-level="${level}" class="${selectedLevel === level ? 'active' : ''}"><span>0${i + 1}</span>${level}${level === assigned ? '<small>YOUR MATCH</small>' : ''}</button>`).join('')}</div><section id="lesson-panel" role="tabpanel" aria-labelledby="tab-${selectedLevel}" class="lessons">${modules[selectedLevel].map((title, i) => `<article class="lesson"><div class="lesson-art art-${i}"><span>${['✧', '⌁', '✳'][i]}</span><small>0${i + 1}</small></div><div class="lesson-content"><div class="eyebrow">${selectedLevel.toUpperCase()} · LESSON 0${i + 1}</div><h3>${title}</h3><p>A new little discovery is coming soon.</p><div class="lesson-buttons"><button disabled title="Slideshows are coming soon">▤ Slideshow <span>⌑</span></button><button disabled title="Lessons are coming soon">▷ Lesson <span>⌑</span></button></div></div></article>`).join('')}</section><section class="tutor-banner"><span class="tutor-icon">✳</span><div><h3>A little help, whenever you need it.</h3><p>Your personal AI learning companion is coming soon.</p></div><span class="coming-pill">AI GUIDE · COMING SOON</span></section></main>${footer()}`;
}
async function supabase(path, { method = 'GET', body, token = session?.access_token, headers = {} } = {}) {
  const res = await fetch(config.supabaseUrl + path, { method, signal: AbortSignal.timeout(15000), headers: { apikey: config.supabaseAnonKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.msg || data?.message || data?.error_description || 'We couldn’t complete that request. Please try again.');
  return data;
}
function saveSession(data) {
  session = { ...data, expires_at: data.expires_at || Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600) };
  sessionStorage.setItem('fairylearn-session', JSON.stringify(session));
}
async function ensureSession() {
  if (session?.expires_at < Date.now() / 1000 + 60) {
    saveSession(await supabase('/auth/v1/token?grant_type=refresh_token', { method: 'POST', token: null, body: { refresh_token: session.refresh_token } }));
  }
}
function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be disabled. */ } }
function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
async function loadAccount() {
  await ensureSession();
  name = session.user?.user_metadata?.name || '';
  const rows = await supabase(`/rest/v1/learning_profiles?user_id=eq.${encodeURIComponent(session.user.id)}&select=answers,description`);
  if (validAnswers(rows?.[0]?.answers)) { answers = rows[0].answers; description = rows[0].description; selectedLevel = null; dashboard(); }
  else { answers = {}; step = 0; questionnaire(); }
}
async function finish() {
  if (busy || !validAnswers(answers)) return;
  busy = true;
  const stopLoading = startLoading('Finding your learning path…');
  const button = app.querySelector('[data-action="next"]'); button.disabled = true; button.textContent = 'Finding your path…';
  description = planDescription(answers);
  try {
    if (session) {
      await ensureSession();
      const res = await fetch('/api/personalize', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ answers }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Couldn’t create your path. Please try again.');
      description = (await res.json()).description;
      await supabase('/rest/v1/learning_profiles?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: { user_id: session.user.id, answers, level: getLevel(answers), description, updated_at: new Date().toISOString() } });
    } else store('fairylearn-preview', { answers, description });
    selectedLevel = null; dashboard(); window.scrollTo(0, 0);
  } catch (error) { toast(error.message); questionnaire(); }
  finally { busy = false; stopLoading(); }
}
app.addEventListener('click', async event => {
  const option = event.target.closest('[data-option]');
  if (option) {
    answers[questions[step].id] = option.dataset.option;
    app.querySelectorAll('[data-option]').forEach(item => { const selected = item === option; item.classList.toggle('selected', selected); item.setAttribute('aria-checked', String(selected)); });
    const dot = app.querySelector(`[data-dot="${questions[step].id}"]`);
    dot.classList.add('answered'); dot.setAttribute('aria-label', `Question ${step + 1}: answered`);
    app.querySelector('[data-action="next"]').disabled = false;
    closeFairyTip();
    return;
  }
  const level = event.target.closest('[data-level]');
  if (level) { selectedLevel = level.dataset.level; dashboard(); document.querySelector(`#tab-${selectedLevel}`).focus({ preventScroll: true }); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  event.preventDefault();
  if (busy) return;
  if (action === 'theme') { toggleTheme(); return; }
  if (action === 'fairy-tip') { const tip = app.querySelector('#fairy-tip'); const open = tip.hidden; tip.hidden = !open; fairyButton.setAttribute('aria-expanded', String(open)); return; }
  if (action === 'close-tip') { closeFairyTip(); fairyButton.focus(); return; }
  if (action === 'how' || action === 'paths') { home(); document.querySelector(action === 'how' ? '#how-it-works' : '#paths').scrollIntoView(); return; }
  if (action === 'home') home();
  if (action === 'signup' || action === 'login') auth(action);
  if (action === 'demo') { const saved = read('fairylearn-preview'); answers = saved?.answers || {}; step = 0; questionnaire(); }
  if (action === 'dashboard') dashboard();
  if (action === 'retake') { step = 0; questionnaire(); }
  if (action === 'previous') { if (step) { step--; questionnaire(); document.querySelector('#question-title').focus({ preventScroll: true }); } else { home(); window.scrollTo(0, 0); } }
  if (action === 'next' && answers[questions[step].id]) { if (step < 4) { step++; questionnaire(); document.querySelector('#question-title').focus({ preventScroll: true }); } else await finish(); }
  if (action === 'logout') { const token = session?.access_token; session = null; sessionStorage.removeItem('fairylearn-session'); answers = {}; name = ''; home(); if (token) supabase('/auth/v1/logout', { method: 'POST', token }).catch(() => {}); }
  if (action !== 'next' && action !== 'previous') window.scrollTo(0, 0);
});
app.addEventListener('keydown', event => {
  if (event.key === 'Escape' && app.querySelector('#fairy-tip:not([hidden])')) { closeFairyTip(); fairyButton.focus(); return; }
  const option = event.target.closest('[data-option]');
  const tab = event.target.closest('[data-level]');
  if (!option && !tab) return;
  const items = [...app.querySelectorAll(option ? '[data-option]' : '[data-level]')];
  const index = items.indexOf(option || tab);
  const offset = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
  if (offset) { event.preventDefault(); const target = items[(index + offset + items.length) % items.length]; target.click(); }
});
app.addEventListener('submit', async event => {
  if (event.target.id !== 'auth-form') return;
  event.preventDefault(); if (busy || !configured) return;
  const form = event.target; const fields = new FormData(form); const button = form.querySelector('[type="submit"]'); const error = form.querySelector('#form-error');
  busy = true; button.disabled = true; button.textContent = 'One little moment…'; error.textContent = '';
  const stopLoading = startLoading(form.dataset.mode === 'signup' ? 'Starting your story…' : 'Welcoming you back…');
  try {
    const signup = form.dataset.mode === 'signup';
    const data = await supabase(signup ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password', { method: 'POST', token: null, body: { email: fields.get('email'), password: fields.get('password'), ...(signup ? { data: { name: String(fields.get('name')).trim() } } : {}) } });
    if (!data.access_token) { form.reset(); toast('Check your email to confirm your account, then come back and log in.'); auth('login'); }
    else { saveSession(data); await loadAccount(); }
  } catch (err) { error.textContent = err.message; }
  finally { busy = false; stopLoading(); button.disabled = false; button.textContent = form.dataset.mode === 'signup' ? 'Create my account ↗' : 'Log in ↗'; }
});

// Supabase email confirmation redirects can return tokens in the URL fragment.
const fragment = new URLSearchParams(location.hash.slice(1));
if (configured && fragment.has('access_token')) {
  const access_token = fragment.get('access_token');
  history.replaceState(null, '', location.pathname);
  try { const user = await supabase('/auth/v1/user', { token: access_token }); session = { access_token, refresh_token: fragment.get('refresh_token'), expires_at: Math.floor(Date.now() / 1000) + Number(fragment.get('expires_in') || 3600), user }; } catch { toast('That confirmation link has expired. Please log in.'); }
} else { try { session = JSON.parse(sessionStorage.getItem('fairylearn-session')); } catch { session = null; } }
if (session && configured) {
  try {
    await ensureSession(); saveSession(session); await loadAccount();
  } catch { session = null; sessionStorage.removeItem('fairylearn-session'); home(); toast('Please log in to load your saved path.'); }
} else home();
stopInitialLoading();
