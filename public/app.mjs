import { questions, levels, validAnswers, planDescription } from './learning.mjs';
import { attachMotion, logoMarkup, startLoading } from './motion.mjs';
import { courseModules, completedCourseIds } from './course.mjs';
import { pathLessons, findPathLesson, fallbackLearningPlan, validLearningPlan, resolvePlanLesson, lessonKey } from './path-lessons.mjs';
import { createAuth, createApi, AuthError } from './auth.mjs';
import { MAX_TROPHIES, shopItems, restoreWallet, trophyBalance, earnedTrophies, itemCount, awardCompletion, awardQuiz, buyItem, consumeItem, toggleItem } from './rewards.mjs';
import { createQuiz, selectChoice, checkAnswer, showHint, nextQuestion, quizScore, quizPassed, passingScore, protectRetry, removeDistractor, mixedQuestions } from './quiz.mjs';

const app = document.querySelector('#app');
let theme = read('fairylearn-theme') === 'night' ? 'night' : 'day';
document.documentElement.dataset.theme = theme;
attachMotion(app);
const stopInitialLoading = startLoading('Opening your next chapter…');
const config = await fetch('/api/config').then(r => r.json()).catch(() => ({}));
const configured = !!(config.supabaseUrl && config.supabaseAnonKey);
const accounts = configured ? createAuth({ url: config.supabaseUrl, anonKey: config.supabaseAnonKey }) : null;
const api = accounts && createApi(accounts);
const currentUser = () => accounts?.user || null;
let accountLoaded = false;
let answers = {};
let step = 0;
let name = '';
let currentView = 'home';
let learningPlan = null;
let guideOpen = false;
let guideBusy = false;
let guideMessages = [];
let guideError = '';
let guideDraft = '';
let guidePending = '';
const guideRoot = document.createElement('div');
guideRoot.id = 'guide-root';
document.body.append(guideRoot);
let description = '';
let busy = false;
let completedModules = completedCourseIds(read('fairylearn-course-progress'));
const UNIT_TEST_ID = 'unit-test';
const UNIT_TEST_LENGTH = 10;
let bestScores = readBestScores();
let quiz = null;
let quizOrigin = 'course';
let activeLesson = null;
let activeLessonIsPersonal = false;
let personalLessons = {};
let completedPersonalLessons = [];
let walletOwner = currentUser()?.id || 'guest';
let wallet = restoreWallet(read(`fairylearn-rewards:${walletOwner}`));
let shopMessage = '';
let shopCategory = 'all';
const shopDialog = document.createElement('dialog');
shopDialog.className = 'shop-dialog';
shopDialog.setAttribute('aria-labelledby', 'shop-title');
document.body.append(shopDialog);
const timerRoot = document.createElement('div');
timerRoot.className = 'study-timer';
document.body.append(timerRoot);
let timerRemaining = 600;
let timerInterval = null;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const star = logoMarkup('brand-logo');
loadRewards();
function trophyIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h10v7a5 5 0 0 1-10 0V3Z"/><path d="M7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-4 1h8"/></svg>';
}
function trophyPocket() {
  return `<button class="trophy-pocket" data-action="shop" data-trophy-pocket aria-label="Item shop, ${trophyBalance(wallet)} trophies" title="Open item shop">${trophyIcon()}<span data-trophy-balance>${trophyBalance(wallet)}</span></button>`;
}
function rewardsBar() {
  return `<section class="rewards-bar" aria-label="Trophies and perks"><div class="rewards-cup">${trophyIcon()}</div><div class="rewards-copy"><div class="eyebrow">LITTLE WINS ADD UP</div><h2><span data-trophy-balance>${trophyBalance(wallet)}</span> trophies to spend</h2><p>Lessons: +1 · Quiz 80%+: +3 · Quiz 95%+: +5 total. Earn up to 400 lifetime trophies.</p></div><button class="button rewards-shop-button" data-action="shop">Visit the item shop <span>↗</span></button></section>`;
}
function applyPerks() {
  document.documentElement.dataset.focus = wallet.equipped['focus-lens'] ? 'on' : 'off';
  document.documentElement.dataset.trail = wallet.equipped['aurora-trail'] ? 'aurora' : wallet.equipped['golden-trail'] ? 'gold' : 'default';
  document.documentElement.dataset.accent = wallet.equipped['ocean-theme'] ? 'ocean' : wallet.equipped['sage-theme'] ? 'sage' : 'default';
  document.documentElement.dataset.stars = wallet.equipped.starfield ? 'on' : 'off';
  document.documentElement.dataset.crown = wallet.equipped['scholar-crown'] ? 'on' : 'off';
  renderStudyTimer();
}
function saveRewards() {
  store(`fairylearn-rewards:${walletOwner}`, wallet);
  refreshRewardDisplays();
}
function refreshRewardDisplays() {
  applyPerks();
  document.querySelectorAll('[data-trophy-balance]').forEach(element => { element.textContent = trophyBalance(wallet); });
  document.querySelectorAll('[data-trophy-pocket]').forEach(button => button.setAttribute('aria-label', `Item shop, ${trophyBalance(wallet)} trophies`));
}
function loadRewards() {
  walletOwner = currentUser()?.id || 'guest';
  wallet = restoreWallet(read(`fairylearn-rewards:${walletOwner}`));
  for (const id of [...completedModules, ...completedPersonalLessons]) wallet = awardCompletion(wallet, id).wallet;
  for (const [id, best] of Object.entries(bestScores)) wallet = awardQuiz(wallet, id, best.score, best.total).wallet;
  saveRewards();
}
function completionRewards() {
  const lesson = ['course-lesson', 'personal-lesson'].includes(currentView) ? awardCompletion(wallet, activeLesson.id) : { wallet, earned: 0 };
  const result = awardQuiz(lesson.wallet, activeLesson.id, quizScore(quiz), quiz.questions.length);
  return { wallet: result.wallet, earned: lesson.earned + result.earned };
}
function rewardPreview() {
  const reward = completionRewards();
  if (earnedTrophies(wallet) >= MAX_TROPHIES) return 'You’ve earned all 400 lifetime trophies. Keep learning and using your perks!';
  return reward.earned ? `Complete to collect ${reward.earned} trophies. Lessons earn 1; quizzes earn 3 at 80%+ or 5 total at 95%+.` : 'You’ve already collected the trophies for this score. Improve to 95%+ to collect any remaining bonus.';
}
function renderStudyTimer() {
  const available = wallet.equipped['study-timer'] && ['personal-lesson', 'course-lesson', 'practice-quiz', 'unit-test'].includes(currentView);
  timerRoot.hidden = !available;
  if (!available) { clearInterval(timerInterval); timerInterval = null; return; }
  timerRoot.innerHTML = `<span>◷ FOCUS SESSION</span><strong role="timer">${String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:${String(timerRemaining % 60).padStart(2, '0')}</strong><button data-timer="toggle">${timerInterval ? 'Pause' : timerRemaining ? 'Start' : 'Done'}</button><button data-timer="reset" aria-label="Reset study timer">↻</button>`;
}
timerRoot.addEventListener('click', event => {
  const action = event.target.closest('[data-timer]')?.dataset.timer;
  if (!action) return;
  if (action === 'reset') { clearInterval(timerInterval); timerInterval = null; timerRemaining = 600; }
  else if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  else if (timerRemaining) timerInterval = setInterval(() => {
    timerRemaining--;
    if (timerRemaining <= 0) { clearInterval(timerInterval); timerInterval = null; toast('Focus session complete. Take a little break!'); }
    const clock = timerRoot.querySelector('[role="timer"]');
    if (clock) clock.textContent = `${String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:${String(timerRemaining % 60).padStart(2, '0')}`;
    if (!timerInterval) renderStudyTimer();
  }, 1000);
  renderStudyTimer();
});
function readJournal() {
  const saved = read(`fairylearn-journal:${walletOwner}`);
  return Array.isArray(saved) ? saved.filter(item => typeof item?.title === 'string' && Number.isInteger(item.score) && Number.isInteger(item.total) && item.total > 0 && item.score >= 0 && item.score <= item.total && Number.isFinite(item.at)).slice(-100) : [];
}
function recordQuiz() {
  store(`fairylearn-journal:${walletOwner}`, [...readJournal(), { title: activeLesson.title || 'Mixed challenge', score: quizScore(quiz), total: quiz.questions.length, at: Date.now() }].slice(-100));
}
function studyJournal() {
  if (!wallet.equipped['mastery-journal']) return '';
  const attempts = readJournal();
  const average = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.score / item.total, 0) / attempts.length * 100) : 0;
  return `<section class="mastery-journal"><div class="eyebrow">▤ YOUR MASTERY JOURNAL</div><h2>Look how far you’ve come.</h2><div class="journal-stats"><span><strong>${completedModules.length + completedPersonalLessons.length}</strong> lessons completed</span><span><strong>${attempts.length}</strong> recent quiz attempts</span><span><strong>${average}%</strong> average quiz score</span><span><strong>${earnedTrophies(wallet)} / 400</strong> lifetime trophies</span></div>${attempts.length ? `<ol>${attempts.slice(-5).reverse().map(item => `<li><span>${escape(item.title)}</span><strong>${Math.round(item.score / item.total * 100)}%</strong><small>${new Date(item.at).toLocaleDateString()}</small></li>`).join('')}</ol>` : '<p>Your next quiz result will appear here.</p>'}</section>`;
}
function openShop() {
  shopMessage = ''; shopCategory = 'all';
  renderShop();
  if (!shopDialog.open) shopDialog.showModal();
}
function renderShop() {
  const balance = trophyBalance(wallet);
  shopDialog.innerHTML = `<div class="shop-heading"><div><div class="eyebrow">A LITTLE EXTRA FOR YOUR JOURNEY</div><h2 id="shop-title">The item <em>shop.</em></h2></div><button class="shop-close" data-shop-close aria-label="Close item shop" autofocus>×</button></div><div class="shop-wallet"><div class="shop-wallet-icon">${trophyIcon()}</div><div><strong>${balance}</strong><span>TROPHIES TO SPEND</span></div><p>${earnedTrophies(wallet)} / 400 earned in your lifetime<br>Spending does not reset this cap.</p></div><p class="shop-intro">${shopItems.length} perks, from 3 to 200 trophies. Use quiz help, equip study tools, or give your journey a new look.</p><p class="shop-status" role="status" aria-live="polite">${escape(shopMessage)}</p><div class="lifetime-progress" role="progressbar" aria-label="Lifetime trophy earnings" aria-valuemin="0" aria-valuemax="400" aria-valuenow="${earnedTrophies(wallet)}"><span style="width:${earnedTrophies(wallet) / 4}%"></span></div><div class="shop-categories" aria-label="Shop categories">${[['all', 'All perks'], ['quiz', 'Quiz help'], ['study', 'Study tools'], ['style', 'Style']].map(([id, label]) => `<button data-shop-category="${id}" aria-pressed="${shopCategory === id}">${label}</button>`).join('')}</div><div class="shop-grid">${shopItems.filter(item => shopCategory === 'all' || (shopCategory === 'quiz' ? item.type === 'consumable' : shopCategory === 'study' ? ['focus-lens', 'study-timer', 'mastery-journal'].includes(item.id) : !['focus-lens', 'study-timer', 'mastery-journal'].includes(item.id) && item.type === 'permanent')).map(item => {
    const owned = itemCount(wallet, item.id);
    const permanent = item.type === 'permanent';
    const equipped = !!wallet.equipped[item.id];
    const shortfall = Math.max(0, item.cost - balance);
    return `<article class="shop-item ${permanent && owned ? 'is-owned' : ''}"><div class="shop-item-top"><div class="shop-item-icon ${item.id}">${item.icon}</div><span>${permanent && owned ? 'OWNED' : item.label}</span></div><h3>${item.name}</h3><p>${item.description}</p><div class="shop-item-bottom"><span class="shop-price">${trophyIcon()} ${item.cost}</span>${!permanent ? `<span class="shop-stock">${owned} in your bag</span>` : '<span class="shop-stock">Permanent perk</span>'}</div>${permanent && owned ? `<button class="button ${equipped ? 'outline' : 'purple'} full" data-equip-item="${item.id}" aria-label="${equipped ? 'Turn off' : 'Equip'} ${item.name}" aria-pressed="${equipped}">${equipped ? 'Equipped · turn off' : 'Equip perk'} <span>${equipped ? '✓' : '↗'}</span></button>` : `<button class="button purple full" data-buy-item="${item.id}" ${shortfall ? 'disabled' : ''}>${shortfall ? (earnedTrophies(wallet) >= MAX_TROPHIES ? 'Lifetime cap reached' : `Need ${shortfall} more trophies`) : `Buy for ${item.cost} trophies`} <span>↗</span></button>`}</article>`;
  }).join('')}</div><div class="shop-how"><strong>How to earn trophies</strong><div><span>Lesson complete <b>+1</b></span><span>Quiz score 80–94% <b>+3</b></span><span>Quiz score 95%+ <b>+5 total</b></span><span>Lifetime earning cap <b>400</b></span></div><p>Each lesson and quiz pays once. Improving an 80% result to 95%+ adds 2 trophies, not another 5. You can earn at most 400 trophies in total, even after spending. Hints are always available free; a Hint Pass protects the point when you use one.</p></div><p class="shop-save-note">${currentUser() ? 'Your trophies and perks are saved for this account in this browser.' : 'Your guest trophies and perks are saved in this browser. Signed-in accounts have their own balance.'}</p>`;
}
shopDialog.addEventListener('click', event => {
  const category = event.target.closest('[data-shop-category]');
  if (category) { shopCategory = category.dataset.shopCategory; renderShop(); shopDialog.querySelector(`[data-shop-category="${shopCategory}"]`)?.focus(); return; }
  if (event.target.closest('[data-shop-close]')) { shopDialog.close(); return; }
  const buy = event.target.closest('[data-buy-item]');
  const equip = event.target.closest('[data-equip-item]');
  if (!buy && !equip) return;
  if (buy) {
    const result = buyItem(wallet, buy.dataset.buyItem);
    if (result.error) shopMessage = result.error;
    else {
      wallet = result.wallet;
      if (result.item.type === 'permanent') wallet = toggleItem(wallet, result.item.id);
      shopMessage = `${result.item.name} ${result.item.type === 'permanent' ? 'purchased and equipped' : 'added to your bag'}!`;
    }
  } else {
    wallet = toggleItem(wallet, equip.dataset.equipItem);
    const item = shopItems.find(item => item.id === equip.dataset.equipItem);
    shopMessage = `${item.name} ${wallet.equipped[item.id] ? 'equipped' : 'turned off'}.`;
  }
  saveRewards();
  const itemId = buy?.dataset.buyItem || equip?.dataset.equipItem;
  renderShop();
  (shopDialog.querySelector(`[data-buy-item="${itemId}"]:not(:disabled), [data-equip-item="${itemId}"]`) || shopDialog.querySelector('[data-shop-close]')).focus();
  if (quiz && app.querySelector('#quiz-body')) renderQuiz();
});
window.addEventListener('storage', event => {
  if (event.key !== `fairylearn-rewards:${walletOwner}`) return;
  wallet = restoreWallet(read(event.key));
  refreshRewardDisplays();
  if (shopDialog.open) renderShop();
  if (quiz && app.querySelector('#quiz-body')) renderQuiz();
});
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
function header(simple = false) { renderStudyTimer(); return `<header class="header"><a class="brand" href="#" data-action="home">${star}<span>fairylearn<span class="brand-ai">AI</span></span></a>${simple ? `<div class="simple-header-actions"><span class="header-note">Your next chapter starts here.</span>${trophyPocket()}${themeButton()}</div>` : `<nav aria-label="Main navigation"><a href="#how-it-works" data-action="how">How it works</a><a href="#paths" data-action="paths">Learning paths</a><button class="nav-link" data-action="course">Explore lessons</button><button class="nav-link" data-action="quizzes">Quizzes</button></nav><div class="header-actions">${trophyPocket()}${themeButton()}${currentUser() ? '<button class="text-button" data-action="dashboard">My path ↗</button><button class="text-button" data-action="logout">Log out</button>' : '<button class="text-button" data-action="login">Log in</button><button class="button small dark" data-action="signup">Get started <span>↗</span></button>'}</div>`}</header>`; }
function footer() { return `<footer><a class="brand" href="#" data-action="home">${star}<span>fairylearn<span class="brand-ai">AI</span></span></a><p>A little curiosity goes a long way.</p><a class="footer-reference" href="/references.html">Sources &amp; project credits ↗</a><span>Made for human potential. ✧</span></footer>`; }
function illustration() { return `<div class="illustration" aria-label="An illustrated winding path through a world of AI discoveries" role="img"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><div class="sky-star s1">✧</div><div class="sky-star s2">✦</div><div class="sky-star s3">✧</div><div class="sky-star s4">+</div><div class="float-tag tag-top"><i class="dot"></i> A path that’s uniquely yours</div><svg class="journey-svg" viewBox="0 0 520 440" fill="none" aria-hidden="true"><path d="M80 410C65 325 390 373 382 283C376 215 148 283 159 190C166 131 318 166 319 80" stroke="#e4e1d6" stroke-width="56"/><path d="M80 410C65 325 390 373 382 283C376 215 148 283 159 190C166 131 318 166 319 80" stroke="#fffdf7" stroke-width="44"/><path d="M80 410C65 325 390 373 382 283C376 215 148 283 159 190C166 131 318 166 319 80" stroke="#c4bcd5" stroke-width="2" stroke-dasharray="7 9"/><ellipse cx="319" cy="82" rx="32" ry="11" fill="#c3b6e0"/><path d="M319 80V20" stroke="#655784" stroke-width="3"/><path d="M321 21L355 30L321 43Z" fill="#9678c0"/></svg><div class="world-card card-spark"><span>✦</span><small>BIG IDEAS</small></div><div class="world-card card-book"><span>▤</span><small>SMALL STEPS</small></div><div class="world-card card-bot"><span class="robot"><i></i><i></i></span><small>YOUR AI GUIDE</small></div><div class="plant plant-one">✳</div><div class="plant plant-two">✳</div><div class="float-tag tag-bottom"><span>✧</span> A little wiser, every day.</div></div>`; }
function home() {
  currentView = 'home';
  app.innerHTML = `${header()}<main><section class="hero"><div class="hero-copy"><div class="eyebrow"><span></span> A LITTLE CURIOSITY. A WORLD OF POSSIBILITY.</div><h1>Big world of AI.<br>Your own <em>little<br>way in.</em><span class="title-star">✧</span></h1><p>AI doesn’t have to feel like another language.<br class="desktop-break"> Find your starting point, follow your curiosity, and learn<br class="desktop-break"> at a pace that feels like you.</p><div class="hero-actions"><button class="button purple" data-action="signup">Find my learning path <span>↗</span></button><span class="hero-caption">No experience needed.<br>Just a little wonder.</span></div><button class="demo-link" data-action="demo">Take a peek without an account <span>→</span></button><button class="demo-link quiz-home-link" data-action="quizzes">Try a quick quiz <span>→</span></button></div>${illustration()}</section><div class="value-strip"><span><i>✧</i> Built around you</span><span><i>◷</i> Your pace, your progress</span><span><i>♧</i> From curious to confident</span><span><i>✳</i> A little help from AI</span></div><section class="how-section" id="how-it-works"><div class="section-intro"><div><div class="eyebrow">A PATH, NOT A LEAP</div><h2>Every great journey starts<br>with a little <em>hello.</em></h2></div><p>You bring the curiosity.<br>We’ll help you find your way.</p></div><div class="steps-grid"><article><span class="step-number">01 /</span><div class="step-icon lavender">☷</div><h3>Tell us a little about you</h3><p>A few quick questions about what you know, what you love, and where you want to go.</p><span class="mini-note">ABOUT 2 MINUTES</span></article><article><span class="step-number">02 /</span><div class="step-icon peach">⌁</div><h3>Find your starting point</h3><p>Get a personal learning path that fits your experience, goals, and everyday life.</p><span class="mini-note">MADE FOR YOU</span></article><article><span class="step-number">03 /</span><div class="step-icon sage">✧</div><h3>Grow one discovery at a time</h3><p>Follow a winding path of AI-tailored lessons chosen for your starting point. Practice as you go, with your AI guide nearby whenever you need a hand.</p><span class="mini-note">YOUR NEXT LITTLE DISCOVERY</span></article></div></section><section class="paths-section" id="paths"><div class="eyebrow">EVERY STARTING POINT BELONGS</div><h2>A little room for <em>everyone.</em></h2><p>Brand-new to AI or ready to go deeper? There’s a path for you.</p><div class="level-preview">${levels.map((level, i) => `<div><span class="level-glyph">${['·', '✧', '✳', '✺'][i]}</span><h3>${level}</h3><p>${['Start with the very basics.', 'Turn curiosity into confidence.', 'Put your knowledge to work.', 'Explore what’s possible next.'][i]}</p></div>`).join('')}</div><button class="button dark" data-action="signup">Let’s find your path <span>↗</span></button></section>${courseTeaser()}</main>${footer()}`;
}
function auth(mode = 'signup', message = '') {
  currentView = mode;
  const signup = mode === 'signup';
  app.innerHTML = `${header(true)}<main class="auth-layout"><aside class="auth-aside"><div class="eyebrow">YOUR CURIOSITY LOOKS GOOD ON YOU</div><h1>A small start.<br><em>Endless possibility.</em></h1><p>A learning experience shaped around your goals,<br>your pace, and your own kind of curious.</p>${illustration()}</aside><section class="auth-panel"><button class="back-link" data-action="home">← Back to home</button><div class="auth-icon">✧</div><h2>${signup ? 'Let’s begin your story.' : 'Welcome back, curious mind.'}</h2><p>${signup ? 'Create your account, then find your path.' : 'Your next little discovery is waiting.'}</p>${!configured ? '<div class="notice">Account setup is coming soon. You can explore the full questionnaire and preview your path below.</div>' : ''}<form id="auth-form" data-mode="${mode}">${signup ? '<label>Your name<input name="name" autocomplete="given-name" placeholder="What should we call you?" maxlength="60" required></label>' : ''}<label>Email address<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label><label>Password<input name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="8" maxlength="128" placeholder="${signup ? 'At least 8 characters' : 'Enter your password'}" required></label><p class="form-error" id="form-error" role="alert">${escape(message)}</p><button class="button purple full" type="submit" ${!configured ? 'disabled' : ''}>${signup ? 'Create my account' : 'Log in'} <span>↗</span></button></form><p class="auth-switch">${signup ? 'Already have an account?' : 'New to Fairylearn?'} <button class="inline-button" data-action="${signup ? 'login' : 'signup'}">${signup ? 'Log in' : 'Create an account'}</button></p><div class="divider"><span>or follow your curiosity</span></div><button class="button outline full" data-action="demo">Explore without an account <span>→</span></button><p class="privacy-note">✧ Your answers help shape your path. Preview answers stay on this device.</p></section></main>${footer()}`;
}
function emailVerification(email) {
  auth('login');
  currentView = 'verify-email';
  app.querySelector('.auth-panel').innerHTML = `<button class="back-link" data-action="home">← Back to home</button><div class="auth-icon" aria-hidden="true">✉</div><h2 id="verification-title" tabindex="-1">Check your inbox.</h2><p>We sent a verification email to <strong class="verification-email">${escape(email)}</strong>. Open the email and click the verification link to finish creating your account.</p><div class="notice">Can’t find it? Check your spam or junk folder. You can close this page while you verify your email.</div><button class="button purple full" data-action="login">Back to log in <span>↗</span></button><p class="auth-switch">Entered the wrong email? <button class="inline-button" data-action="signup">Try again</button></p>`;
  app.querySelector('#verification-title').focus({ preventScroll: true });
  window.scrollTo(0, 0);
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
  app.innerHTML = `${header(true)}<main class="onboarding"><div class="onboarding-intro"><div class="eyebrow">A PATH THAT FEELS LIKE YOU</div><h2>First, a little <em>getting to know you.</em></h2><p>Five small questions. A whole world to discover.</p><div class="question-dots" role="group" aria-label="Question progress">${questions.map((item, i) => `<span class="question-dot ${answers[item.id] ? 'answered' : ''} ${i === step ? 'current' : ''}" data-dot="${item.id}" role="img" aria-label="Question ${i + 1}: ${answers[item.id] ? 'answered' : i === step ? 'current' : 'not answered'}"></span>`).join('')}</div><span class="question-count" aria-live="polite">Question ${step + 1} of ${questions.length}</span></div><section class="question-card fairy-corner-${step}" aria-labelledby="question-title"><div class="question-card-content"><div class="question-topline"><span class="question-kicker">QUESTION 0${step + 1}</span><span>0${step + 1} / 0${questions.length}</span></div><h1 tabindex="-1" id="question-title">${q.title}</h1><p class="question-subtitle">${q.subtitle}</p><div class="options" role="radiogroup" aria-labelledby="question-title">${q.options.map(([value, title, subtitle, icon]) => `<button class="option ${answers[q.id] === value ? 'selected' : ''}" role="radio" aria-checked="${answers[q.id] === value}" data-option="${value}"><span class="option-icon">${icon}</span><span><strong>${title}</strong><small>${subtitle}</small></span><span class="radio-mark"></span></button>`).join('')}</div><div class="question-controls"><button class="back-link" data-action="previous">← ${step ? 'Back' : 'Home'}</button><span class="save-label">${currentUser() ?'Saved when you finish' : 'Preview • no account needed'}</span><button class="button purple" data-action="next" ${!answers[q.id] ? 'disabled' : ''}>${step === 4 ? 'Find my path' : 'Continue'} <span>→</span></button></div></div><aside id="fairy-tip" class="fairy-tip" role="region" aria-label="About this question" hidden><div class="fairy-tip-heading"><span>✧ A note from your fairy</span><button type="button" data-action="close-tip" aria-label="Close fairy tip">×</button></div><p>${fairyTips[q.id]}</p></aside></section></main>`;
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
function courseTeaser() {
  return `<section class="course-teaser"><div><div class="eyebrow">START LEARNING TODAY</div><h2>Start small. Keep discovering.</h2><p>Try three free essentials, then follow an AI learning path that grows with you.</p></div><button class="button purple" data-action="course">Explore free lessons <span>→</span></button></section>`;
}
function courseHub() {
  currentView = 'course';
  const count = completedModules.length;
  app.innerHTML = `${header()}<main class="course-page"><section class="course-hero"><div class="eyebrow">YOUR AI LEARNING QUEST</div><h1>Small lessons. <em>Big ideas.</em></h1><p>Made for curious high school students. You can start here without an account.</p><div class="course-progress" role="progressbar" aria-label="Lessons completed" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${count}"><div><span>YOUR PROGRESS</span><strong>${count} of 3 lessons complete</strong></div><div class="course-progress-track"><span style="width:${count / 3 * 100}%"></span></div></div><div class="badge-row" aria-label="Achievement badges">${courseModules.map(module => `<span class="course-badge ${completedModules.includes(module.id) ? 'earned' : ''}" title="${completedModules.includes(module.id) ? 'Earned' : 'Complete the lesson to earn'} ${module.badge}"><span aria-hidden="true">${module.icon}</span>${module.badge}${completedModules.includes(module.id) ? ' ✓' : ''}</span>`).join('')}</div></section>${rewardsBar()}${studyJournal()}<section class="infinite-learning-card"><div><div class="eyebrow">KEEP FOLLOWING YOUR CURIOSITY</div><h2>There’s always another discovery.</h2><p>These free lessons are your starting point. Your personal AI path creates new chapters and lesson quizzes as you go.</p></div><button class="button purple" data-action="${currentUser() ? 'dashboard' : 'signup'}">${currentUser() ? 'Continue my AI journey' : 'Create my AI learning path'} <span>→</span></button></section>${quizInvitation()}<section class="course-grid" aria-label="Learning modules">${courseModules.map(module => `<article class="course-module"><div class="module-meta"><span>${module.category}</span><span>${module.time} · ${module.quiz.length}-question quiz</span></div><div class="module-symbol" aria-hidden="true">${module.icon}</div><h2>${module.title}</h2><p>${module.summary}</p><button class="button ${completedModules.includes(module.id) ? 'outline' : 'purple'}" data-module="${module.id}">${completedModules.includes(module.id) ? 'Review lesson' : 'Start lesson'} <span>→</span></button><small>${completedModules.includes(module.id) ? '✓ Completed' : `Lesson ${module.number} of 03`}${bestScoreText(module.id)}</small></article>`).join('')}</section><section class="unit-test-card"><div class="module-symbol" aria-hidden="true">✺</div><div><div class="eyebrow">UNIT TEST · ${UNIT_TEST_LENGTH} QUESTIONS</div><h2>Show what you know.</h2><p>Mixed questions from all three lessons, one at a time. ${bestScores[UNIT_TEST_ID] ? `Best score: ${bestScores[UNIT_TEST_ID].score} of ${bestScores[UNIT_TEST_ID].total}.` : 'Take it whenever you feel ready.'}</p></div><button class="button purple" data-action="unit-test">${bestScores[UNIT_TEST_ID] ? 'Retake' : 'Start'} unit test <span>→</span></button></section><p class="course-save-note">✧ Your lesson progress is saved in this browser.</p></main>${footer()}`;
}
function renderLesson(module, personal = false) {
  currentView = personal ? 'personal-lesson' : 'course-lesson';
  activeLesson = module;
  activeLessonIsPersonal = personal;
  renderGuide();
  quiz = createQuiz(module.quiz);
  const backAction = personal ? 'dashboard' : 'course';
  app.innerHTML = `${header(true)}<main class="course-page lesson-page"><button class="back-link" data-action="${backAction}">← ${personal ? 'My learning path' : 'All lessons'}</button><div class="lesson-heading"><div class="eyebrow">${escape(module.category)} · LESSON ${escape(module.number)}</div><h1>${escape(module.title)}</h1><p>${escape(module.summary)}</p>${personal ? '<p class="ai-lesson-note">✧ Made with AI for your answers. Check important facts with the linked source and your teacher.</p>' : ''}</div><div class="lesson-body"><div class="lesson-copy">${module.sections.map((section, index) => `<section><span class="lesson-step">0${index + 1}</span><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></section>`).join('')}<div class="try-it"><strong>✧ Your turn</strong><p>${escape(module.task)}</p></div>${!personal && module.id === 'tools' ? '<div class="prompt-lab"><h2>Build a practice prompt</h2><p>Nothing you type here is sent to an AI service.</p><label>My topic<input data-prompt-field="topic" placeholder="e.g. photosynthesis" maxlength="80"></label><label>What I want to practice<input data-prompt-field="task" placeholder="e.g. a short quiz" maxlength="80"></label><label>My grade<input data-prompt-field="grade" placeholder="e.g. 10" maxlength="20"></label><div class="prompt-preview" role="status" aria-live="polite">Your prompt will appear here as you type.</div></div>' : ''}<p class="lesson-source">Learn more: <a href="${module.source}" target="_blank" rel="noopener noreferrer">${personal ? 'Related reference' : 'Original source'} ↗</a> · <a href="/references.html">All sources ↗</a></p></div>${quizPanel()}</div></main>${footer()}`;
  renderQuiz();
}
function courseLesson(id) {
  const module = courseModules.find(item => item.id === id);
  if (!module) return courseHub();
  renderLesson(module);
}
function quizInvitation() {
  return '<section class="quiz-invitation"><div class="quiz-invitation-icon" aria-hidden="true">?</div><div><div class="eyebrow">PUT YOUR KNOW-HOW TO THE TEST</div><h2>Ready for a little challenge?</h2><p>Try a topic quiz or a mixed challenge. Earn trophies as you learn.</p></div><button class="button purple" data-action="quizzes">Explore quizzes <span>→</span></button></section>';
}
function quizRewardLabel(id, total) {
  const remaining = awardQuiz(wallet, id, total, total).earned;
  return remaining ? `Up to ${remaining} trophies to collect` : 'Rewards collected · keep practicing';
}
function quizHub() {
  currentView = 'quizzes';
  const ids = [...courseModules.map(module => module.id), UNIT_TEST_ID];
  const passed = ids.filter(id => bestScores[id] && bestScores[id].score >= passingScore(bestScores[id].total)).length;
  app.innerHTML = `${header()}<main class="course-page quiz-hub"><section class="quiz-hub-hero"><div><div class="eyebrow">SMALL CHALLENGES. BIG LITTLE WINS.</div><h1>Let’s see what<br><em>you know.</em></h1><p>Pick a topic, test an idea, and learn from every answer. Hints, explanations, and your perks are here to help.</p></div><div class="quiz-hub-progress"><span aria-hidden="true">✧</span><strong>${passed}<small> / 4</small></strong><p>QUIZZES PASSED</p></div></section>${rewardsBar()}${studyJournal()}<div class="quiz-library-heading"><div><div class="eyebrow">CHOOSE YOUR CHALLENGE</div><h2>A little practice goes a long way.</h2></div><span>No account needed</span></div><section class="course-grid quiz-library" aria-label="Topic quizzes">${courseModules.map((module, index) => {
    const best = bestScores[module.id];
    return `<article class="course-module quiz-library-card"><div class="module-meta"><span>QUIZ 0${index + 1}</span><span>${module.quiz.length} questions · 3 min</span></div><div class="module-symbol" aria-hidden="true">${module.icon}</div><h2>${module.title}</h2><p>${escape(module.summary)}</p><div class="quiz-card-details"><span>Pass with ${passingScore(module.quiz.length)} of ${module.quiz.length} points</span><span>${quizRewardLabel(module.id, module.quiz.length)}</span></div><button class="button ${best ? 'outline' : 'purple'}" data-practice-quiz="${module.id}">${best ? 'Retake quiz' : 'Start quiz'} <span>→</span></button><div class="quiz-card-footer"><small>${best ? `Best score: ${best.score}/${best.total}` : 'Your first little challenge awaits.'}</small><button class="inline-button" data-module="${module.id}">Review lesson ↗</button></div></article>`;
  }).join('')}</section><section class="quiz-mixed-card"><div class="quiz-mixed-symbol" aria-hidden="true">✺</div><div><div class="eyebrow">MIXED CHALLENGE · ${UNIT_TEST_LENGTH} QUESTIONS</div><h2>Bring it all together.</h2><p>Ten questions across AI basics, practical tools, and responsible use. Pass with ${passingScore(UNIT_TEST_LENGTH)} of ${UNIT_TEST_LENGTH} points.</p><small>${bestScores[UNIT_TEST_ID] ? `Best score: ${bestScores[UNIT_TEST_ID].score}/${bestScores[UNIT_TEST_ID].total} · ` : ''}${quizRewardLabel(UNIT_TEST_ID, UNIT_TEST_LENGTH)}</small></div><button class="button purple" data-action="unit-test">${bestScores[UNIT_TEST_ID] ? 'Retake' : 'Start'} mixed quiz <span>→</span></button></section><p class="quiz-hub-note">Trophy rewards are shared with lesson quizzes and can be collected once. Best scores are saved in this browser.</p></main>${footer()}`;
  renderGuide();
}
function practiceQuiz(id) {
  const module = courseModules.find(item => item.id === id);
  if (!module) return;
  quizOrigin = 'quizzes';
  currentView = 'practice-quiz';
  activeLesson = module;
  activeLessonIsPersonal = false;
  quiz = createQuiz(module.quiz);
  app.innerHTML = `${header(true)}<main class="course-page lesson-page standalone-quiz"><button class="back-link" data-action="quizzes">← All quizzes</button><div class="standalone-quiz-heading"><div class="eyebrow">${module.category} · ${module.quiz.length}-QUESTION QUIZ</div><h1>${module.title}</h1><p>Earn ${passingScore(module.quiz.length)} of ${module.quiz.length} points to pass. Check each answer, learn from the explanation, and use a hint whenever you need one.</p><button class="inline-button" data-module="${module.id}">Want a refresher? Review the lesson ↗</button></div>${quizPanel('standalone-quiz-panel')}</main>${footer()}`;
  renderQuiz();
  renderGuide();
  app.querySelector('#quiz-heading')?.focus({ preventScroll: true });
}
function unitTest(origin = 'course') {
  quizOrigin = origin;
  currentView = 'unit-test';
  activeLesson = { id: UNIT_TEST_ID };
  activeLessonIsPersonal = false;
  quiz = createQuiz(mixedQuestions(courseModules, UNIT_TEST_LENGTH));
  app.innerHTML = `${header(true)}<main class="course-page lesson-page"><button class="back-link" data-action="${quizOrigin}">← ${quizOrigin === 'quizzes' ? 'All quizzes' : 'All lessons'}</button><div class="lesson-heading"><div class="eyebrow">AI LEARNING QUEST · UNIT TEST</div><h1>Show what you know.</h1><p>${UNIT_TEST_LENGTH} questions from all three lessons. Each first-try answer earns a point. Free hints are always available; shop perks can protect a point when you need help.</p></div>${quizPanel('unit-test-panel')}</main>${footer()}`;
  renderQuiz();
}
// The quiz lives in its own panel so each answer re-renders only the panel, not the page.
function quizPanel(className = '') {
  return `<aside class="lesson-check quiz-panel ${className}" aria-labelledby="quiz-heading"><div id="quiz-body"></div><p class="visually-hidden" id="quiz-live" aria-live="polite"></p></aside>`;
}
function completeLabel() {
  if (activeLesson?.id === UNIT_TEST_ID) return quizOrigin === 'quizzes' ? 'Finish mixed quiz' : 'Finish unit test';
  if (currentView === 'practice-quiz') return 'Finish quiz & collect rewards';
  return activeLessonIsPersonal ? 'Complete lesson' : `Earn ${escape(activeLesson.badge)} badge`;
}
function quizPerks() {
  const hint = itemCount(wallet, 'hint-pass'), retry = itemCount(wallet, 'retry-charm'), clarity = itemCount(wallet, 'elimination-token');
  const hintEligible = !quiz.hintShown && !['correct', 'done'].includes(quiz.status) && (quiz.eliminated.length === 0 || quiz.protectedRetry && quiz.eliminated.length === 1);
  const retryEligible = quiz.status === 'wrong' && quiz.eliminated.length === 1 && !quiz.protectedRetry && (!quiz.hintShown || quiz.protectedHint);
  return `<div class="quiz-perks"><div><span class="eyebrow">YOUR PERKS</span><button class="inline-button" data-action="shop">Item shop ↗</button></div>${quiz.protectedHint ? '<p class="perk-active">✧ Hint Pass active · your hint won’t cost a point.</p>' : hint && hintEligible ? `<button class="perk-use" data-quiz="use-hint-pass">✧ Use Hint Pass <span>${hint} owned</span></button>` : ''}${quiz.protectedRetry ? '<p class="perk-active">↻ Retry Charm active · make your next choice count.</p>' : retry && retryEligible ? `<button class="perk-use" data-quiz="use-retry-charm">↻ Use Retry Charm <span>${retry} owned</span></button>` : ''}${clarity && !quiz.removed.length && !['correct', 'done'].includes(quiz.status) ? `<button class="perk-use" data-quiz="use-clarity">− Use Clarity Token <span>${clarity} owned</span></button>` : ''}${!hint && !retry && !clarity ? '<p>Earn trophies to pick up a little help for your next quiz.</p>' : `<small>Inventory: ${clarity} Clarity ${clarity === 1 ? 'Token' : 'Tokens'} · ${hint} Hint ${hint === 1 ? 'Pass' : 'Passes'} · ${retry} Retry ${retry === 1 ? 'Charm' : 'Charms'}</small>`}</div>`;
}
function quizMarkup() {
  const total = quiz.questions.length;
  const dots = quiz.questions.map((_, i) => {
    const state = i < quiz.results.length ? (quiz.results[i] ? 'right' : 'missed') : i === quiz.index ? 'current' : '';
    const label = state === 'right' ? 'point earned' : state === 'missed' ? 'completed with help' : state === 'current' ? 'current question' : 'not answered yet';
    return `<li class="quiz-dot ${state}"><span class="visually-hidden">Question ${i + 1}: ${label}</span></li>`;
  }).join('');
  const kicker = activeLesson?.id === UNIT_TEST_ID ? 'UNIT TEST' : 'QUIZ';
  if (quiz.status === 'done') {
    const score = quizScore(quiz), passed = quizPassed(quiz);
    return `<div class="quiz-topline"><span class="eyebrow">${kicker}</span><span>Complete</span></div><ol class="quiz-dots">${dots}</ol><div class="quiz-result ${passed ? 'passed' : ''}"><strong class="quiz-score">${score}<span> / ${total}</span></strong><h2 id="quiz-heading" tabindex="-1">${passed ? (score === total ? 'Perfect score!' : 'Nice work!') : 'Almost there.'}</h2><p>${passed ? `You earned ${score} of ${total} points.` : `You earned ${score} of ${total} points. Get ${passingScore(total)} to move on. Review the lesson, then try again.`}</p></div><p class="quiz-reward-preview">${passed ? rewardPreview() : 'Pass this quiz to earn trophies for the item shop.'}</p><div class="quiz-actions">${passed ? `<button class="button purple full" data-action="complete-module" data-quiz-primary>${completeLabel()} <span>✧</span></button>` : ''}<button class="button ${passed ? 'outline' : 'purple'} full" data-quiz="restart" ${passed ? '' : 'data-quiz-primary'}>${passed ? 'Retake quiz' : 'Try the quiz again'} <span>↻</span></button></div>`;
  }
  const item = quiz.questions[quiz.index];
  const answered = quiz.status === 'correct';
  const choices = item.choices.map((choice, index) => {
    const eliminated = quiz.eliminated.includes(index);
    const removed = quiz.removed.includes(index);
    const state = removed ? 'removed' : answered && index === item.answer ? 'correct' : eliminated ? 'wrong' : quiz.selected === index ? 'selected' : '';
    return `<button type="button" class="quiz-choice ${state}" role="radio" aria-checked="${quiz.selected === index}" data-quiz-choice="${index}" ${answered || eliminated || removed ? 'disabled' : ''}><span>${String.fromCharCode(65 + index)}</span>${escape(choice)}</button>`;
  }).join('');
  const feedback = answered ? `<strong>Correct!</strong> ${escape(item.explanation)}`
    : quiz.status === 'wrong' ? `<strong>Not quite.</strong> ${quiz.hintShown ? 'Try another answer.' : 'Try another answer, or get a hint.'}`
    : 'Choose an answer, then check it.';
  const last = quiz.index === total - 1;
  return `<div class="quiz-topline"><span class="eyebrow">${kicker}</span><span>Question ${quiz.index + 1} of ${total}</span></div><ol class="quiz-dots">${dots}</ol><h2 id="quiz-heading" tabindex="-1">${escape(item.question)}</h2><div class="quiz-options" role="radiogroup" aria-labelledby="quiz-heading">${choices}</div>${quiz.hintShown && !answered ? `<p class="quiz-hint"><strong>Hint:</strong> ${escape(item.hint)}</p>` : ''}<p id="quiz-feedback" class="${quiz.status}">${feedback}</p><div class="quiz-actions">${answered ? `<button class="button purple full" data-quiz="next" data-quiz-primary>${last ? 'See my results' : 'Next question'} <span>→</span></button>` : `<button class="button purple full" data-quiz="check" data-quiz-primary ${quiz.selected === null || quiz.status === 'wrong' ? 'disabled' : ''}>Check <span>✓</span></button>${quiz.hintShown ? '' : '<button class="inline-button quiz-hint-button" data-quiz="hint">Get a hint</button>'}`}${quizPerks()}</div>`;
}
function renderQuiz(focus) {
  const body = app.querySelector('#quiz-body');
  if (!body || !quiz) return;
  body.innerHTML = quizMarkup();
  const live = app.querySelector('#quiz-live');
  live.textContent = quiz.status === 'correct' ? 'Correct!' : quiz.status === 'wrong' ? 'Not quite. Try another answer.' : quiz.status === 'done' ? `Quiz complete. ${quizScore(quiz)} of ${quiz.questions.length} points.` : '';
  if (focus === 'heading') body.querySelector('#quiz-heading')?.focus({ preventScroll: true });
  if (focus === 'primary') body.querySelector('[data-quiz-primary]:not(:disabled)')?.focus({ preventScroll: true });
  if (focus === 'choice') body.querySelector('.quiz-choice[aria-checked="true"]')?.focus({ preventScroll: true });
}
function handleQuiz(action, choice) {
  if (action === 'use-clarity') {
    const next = removeDistractor(quiz);
    if (next === quiz) return;
    const result = consumeItem(wallet, 'elimination-token');
    if (result.error) return toast(result.error);
    wallet = result.wallet; saveRewards(); quiz = next; renderQuiz();
    return toast('One incorrect option removed. Your score is unchanged.');
  }
  if (action === 'use-hint-pass' || action === 'use-retry-charm') {
    const hint = action === 'use-hint-pass';
    const eligible = hint ? !quiz.hintShown && !['correct', 'done'].includes(quiz.status) && (quiz.eliminated.length === 0 || quiz.protectedRetry && quiz.eliminated.length === 1) : quiz.status === 'wrong' && quiz.eliminated.length === 1 && !quiz.protectedRetry && (!quiz.hintShown || quiz.protectedHint);
    if (!eligible) return;
    const result = consumeItem(wallet, hint ? 'hint-pass' : 'retry-charm');
    if (result.error) return toast(result.error);
    wallet = result.wallet; saveRewards();
    quiz = hint ? showHint(quiz, true) : protectRetry(quiz);
    toast(hint ? 'Hint Pass used. Your point is protected.' : 'Retry Charm used. Get your next choice right to keep the point.');
    return renderQuiz();
  }
  if (action === 'choice') { quiz = selectChoice(quiz, choice); return renderQuiz('choice'); }
  if (action === 'check') { quiz = checkAnswer(quiz); return renderQuiz(quiz.status === 'correct' ? 'primary' : 'choice'); }
  if (action === 'hint') { quiz = showHint(quiz); return renderQuiz(); }
  if (action === 'restart') { quiz = createQuiz(quiz.questions); return renderQuiz('heading'); }
  if (action === 'next') {
    quiz = nextQuestion(quiz);
    if (quiz.status === 'done') { recordQuiz(); if (!activeLessonIsPersonal) saveBestScore(activeLesson.id, quizScore(quiz), quiz.questions.length); }
    renderQuiz('heading');
  }
}
function readBestScores() {
  const stored = read('fairylearn-quiz-scores');
  const valid = new Set([...courseModules.map(module => module.id), UNIT_TEST_ID]);
  return Object.fromEntries(Object.entries(stored && typeof stored === 'object' ? stored : {})
    .filter(([id, best]) => valid.has(id) && Number.isInteger(best?.score) && Number.isInteger(best?.total) && best.total > 0 && best.score >= 0 && best.score <= best.total));
}
function saveBestScore(id, score, total) {
  const previous = bestScores[id];
  if (previous && (previous.score / previous.total > score / total || previous.score / previous.total === score / total && previous.total >= total)) return;
  bestScores = { ...bestScores, [id]: { score, total } };
  store('fairylearn-quiz-scores', bestScores);
}
function bestScoreText(id) {
  return bestScores[id] ? ` · Best quiz ${bestScores[id].score}/${bestScores[id].total}` : '';
}
function personalKey(level, index, id) { return id || `${level}:${index}`; }
function personalProgressKey() { return `fairylearn-personal-progress:${currentUser()?.id || 'guest'}`; }
function loadPersonalProgress() {
  const valid = new Set(levels.flatMap(level => pathLessons[level].map((_, index) => personalKey(level, index))));
  const stored = read(personalProgressKey());
  completedPersonalLessons = Array.isArray(stored) ? [...new Set(stored.filter(key => valid.has(key) || /^ai:[a-f0-9-]{36}$/.test(key)))] : [];
}
async function openPersonalLesson(level, index, id) {
  const reference = id ? { id } : { level, index };
  const topic = resolvePlanLesson(learningPlan, reference);
  if (!topic) return;
  if (!currentUser()) { guideRoot.innerHTML = ''; auth('signup'); return; }
  if (!config.aiLessonsEnabled) { toast('Personal lessons need an OpenAI key on the server.'); return; }
  const key = personalKey(level, index, id);
  if (personalLessons[key]) { renderLesson(personalLessons[key], true); window.scrollTo(0, 0); return; }
  busy = true;
  const stopLoading = startLoading('Your fairy is writing a lesson just for you…');
  try {
    const { lesson } = await api('/api/lesson', reference);
    if (!lesson || !Array.isArray(lesson.sections) || !Array.isArray(lesson.quiz) || lesson.quiz.length < 5) throw new Error('The lesson was incomplete. Please try again.');
    personalLessons[key] = { ...lesson, id: key, lessonRef: reference, title: topic.title, source: topic.source || pathLessons[level]?.[0]?.source, category: `${level.toUpperCase()} · PERSONAL AI LESSON`, number: String((currentLearningPlan().lessons.findIndex(item => lessonKey(item) === key) + 1) || index + 1).padStart(2, '0') };
    renderLesson(personalLessons[key], true);
    window.scrollTo(0, 0);
  } catch (error) { handleFailure(error); }
  finally { busy = false; stopLoading(); }
}
function currentLearningPlan() {
  return validLearningPlan(learningPlan) ? learningPlan : fallbackLearningPlan(answers);
}
function dashboard() {
  currentView = 'dashboard';
  const plan = currentLearningPlan();
  const completed = plan.lessons.filter(item => completedPersonalLessons.includes(lessonKey(item))).length;
  const next = plan.lessons.findIndex(item => !completedPersonalLessons.includes(lessonKey(item)));
  const total = plan.lessons.length;
  const rows = Math.ceil(total / 4);
  const points = plan.lessons.map((_, i) => {
    const row = Math.floor(i / 4), col = row % 2 ? 3 - i % 4 : i % 4;
    return { x: 125 + col * 250, y: 88 + row * 235 + [16, -16, 16, -16][col] };
  });
  const curve = points.map((point, i) => {
    if (!i) return `M ${point.x} ${point.y}`;
    const previous = points[i - 1];
    if (previous.x === point.x) return `C ${point.x + (point.x > 500 ? 95 : -95)} ${previous.y + 70}, ${point.x + (point.x > 500 ? 95 : -95)} ${point.y - 70}, ${point.x} ${point.y}`;
    return `C ${(previous.x + point.x) / 2} ${previous.y}, ${(previous.x + point.x) / 2} ${point.y}, ${point.x} ${point.y}`;
  }).join(' ');
  app.innerHTML = `${header()}<main class="dashboard journey-dashboard"><div class="dashboard-greeting"><div><div class="eyebrow">YOUR OWN LITTLE WAY FORWARD</div><h1>${name ? `${escape(name)}’s next` : 'Your next'} <em>chapter.</em></h1><p>A little learning. A little practice. A world of possibility.</p></div><div class="journey-level"><span>✧</span><div><small>YOUR STARTING POINT</small><strong>${escape(plan.level)}</strong></div></div></div>
  ${!currentUser() ? '<div class="preview-notice"><span>✧ A preview of your journey. Create an account for AI placement, tailored lessons, and your guide.</span><button class="inline-button" data-action="signup">Create an account →</button></div>' : ''}
  ${rewardsBar()}${studyJournal()}<section class="journey-summary"><div class="journey-summary-copy"><div class="eyebrow">${plan.ai ? 'CHOSEN FOR YOU BY AI' : 'YOUR STANDARD STARTING PATH'}</div><p>${escape(description || planDescription(answers))}</p>${currentUser() && !plan.ai ? '<small>AI placement is unavailable. You can follow this starting path or retry by updating your answers.</small>' : ''}<button class="inline-button" data-action="retake">Update my answers ↗</button></div><div class="journey-progress"><div><strong>${completed}<span> / ${total}</span></strong><small>LESSONS COMPLETE</small></div><div class="journey-progress-track" role="progressbar" aria-label="Path completion" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${completed}"><span style="width:${completed / total * 100}%"></span></div><p>${next < 0 ? 'You did it. Revisit any stop to keep practicing.' : 'One small discovery at a time.'}</p></div></section>
  ${quizInvitation()}<section class="journey-section" aria-labelledby="journey-title"><div class="journey-section-heading"><div><div class="eyebrow">FOLLOW YOUR CURIOSITY</div><h2 id="journey-title">Your learning journey</h2></div><span class="journey-legend"><i></i> Your next lesson</span></div><p class="journey-instruction">Start with the glowing circle. Finish each lesson’s knowledge check to take your next step.</p>
  <div class="journey-map" style="--map-height:${rows * 235}px"><svg class="journey-connections" viewBox="0 0 1000 ${rows * 235}" preserveAspectRatio="none" aria-hidden="true"><path class="journey-track-shadow" d="${curve}"/><path class="journey-track" d="${curve}"/></svg><ol class="journey-stops" aria-label="Your recommended lessons">${plan.lessons.map((item, i) => {
    const topic = resolvePlanLesson(plan, item);
    const done = completedPersonalLessons.includes(lessonKey(item));
    const isNext = i === next;
    const locked = !done && !isNext;
    const point = points[i];
    return `<li class="journey-stop ${done ? 'is-complete' : isNext ? 'is-next' : 'is-upcoming'}" style="--stop-x:${point.x / 10}%;--stop-y:${point.y}px"><button class="lesson-circle" data-personal-lesson="${item.index}" data-personal-level="${item.level}" ${item.id ? `data-personal-id="${item.id}"` : ''} ${locked ? 'disabled' : ''} ${isNext ? 'aria-current="step"' : ''} aria-label="${escape(`${i + 1}. ${topic.title}. ${done ? 'Completed, review lesson' : isNext ? 'Start next lesson' : 'Complete earlier lessons to unlock'}`)}"><span aria-hidden="true">${done ? '✓' : locked ? '◇' : '✦'}</span><small>${String(i + 1).padStart(2, '0')}</small></button><div class="stop-caption"><span>${done ? 'COMPLETED' : isNext ? 'UP NEXT' : escape(item.level.toUpperCase())}</span><h3>${escape(topic.title)}</h3>${isNext ? `<p>${currentUser() ? 'Your next little discovery →' : 'Create an account to begin →'}</p>` : ''}</div></li>`;
  }).join('')}</ol></div><div class="journey-finish"><span>✧</span><h2>Your journey keeps growing.</h2><p>AI adds another chapter as you near the end. You can also plan six fresh lessons here whenever you’re ready.</p>${currentUser() ? `<button class="button purple" data-action="continue-path" ${!config.aiLessonsEnabled ? 'disabled' : ''}>Generate my next 6 lessons <span>↗</span></button>` : '<button class="button purple" data-action="signup">Create an account to keep learning <span>↗</span></button>'}</div></section>
  <section class="journey-guide-card"><div class="guide-card-symbol" aria-hidden="true">✳</div><div><div class="eyebrow">A LITTLE HELP ALONG THE WAY</div><h2>Meet your AI guide.</h2><p>Ask a question, try a different explanation, or get a hint when you’re stuck.</p></div><button class="button purple" data-action="open-guide">Ask your guide <span>↗</span></button></section></main>${footer()}`;
  renderGuide();
}
async function continuePath() {
  if (!currentUser() || busy) return;
  busy = true;
  const stopLoading = startLoading('Planning six new discoveries for your journey…');
  const button = app.querySelector('[data-action="continue-path"]');
  if (button) { button.disabled = true; button.textContent = 'Planning your next chapter…'; }
  try {
    const result = await api('/api/path/continue', { completed: completedPersonalLessons.slice(-1000) });
    if (!validLearningPlan(result.plan)) throw new Error('The new chapter was incomplete. Please try again.');
    learningPlan = result.plan;
    dashboard();
    toast('Six new lessons added to your journey. Keep going!');
  } catch (error) { handleFailure(error); if (button?.isConnected) { button.disabled = false; button.textContent = 'Generate my next 6 lessons ↗'; } }
  finally { busy = false; stopLoading(); }
}
function renderGuide() {
  if (!['dashboard', 'personal-lesson'].includes(currentView) && !currentUser()) { guideRoot.innerHTML = ''; return; }
  if (!guideOpen) {
    guideRoot.innerHTML = '<button class="guide-launcher" aria-label="Open your AI guide" aria-expanded="false" data-guide-action="open"><span aria-hidden="true">✳</span> Your AI guide</button>';
    return;
  }
  const available = currentUser() && config.aiLessonsEnabled && validAnswers(answers);
  guideRoot.innerHTML = `<section class="guide-panel" role="dialog" aria-labelledby="guide-title"><div class="guide-panel-header"><span aria-hidden="true">✳</span><div><h2 id="guide-title">Your little AI guide</h2><p>Here to help you find your way.</p></div><button type="button" aria-label="Close AI guide" data-guide-action="close">×</button></div><div class="guide-transcript" role="log" aria-label="Conversation" aria-live="polite" aria-busy="${guideBusy}"><p class="guide-message assistant">Hi${name ? `, ${escape(name)}` : ''}! Ask me about AI, or tell me which part of a lesson feels tricky. We’ll work through it together.</p>${guideMessages.map(message => `<p class="guide-message ${message.role}">${escape(message.content)}</p>`).join('')}${guidePending ? `<p class="guide-message user">${escape(guidePending)}</p>` : ''}${guideBusy ? '<p class="guide-thinking">Your guide is thinking…</p>' : ''}</div>${available ? `<form id="guide-form"><label class="guide-label" for="guide-message">What are you curious about?</label><textarea id="guide-message" name="message" rows="2" maxlength="2000" placeholder="Explain this another way…" ${guideBusy ? 'disabled' : ''} required>${escape(guideDraft)}</textarea><p class="guide-error" role="alert">${escape(guideError)}</p><div class="guide-form-footer"><small>AI can make mistakes. Check important facts.</small><button class="button purple" type="submit" ${guideBusy ? 'disabled' : ''}>Send ↗</button></div></form>` : `<div class="guide-unavailable"><p>${!currentUser() ? 'Create an account and answer the five questions to chat with your personal guide.' : !validAnswers(answers) ? 'Finish your five questions to meet your guide.' : 'Your guide is unavailable until AI is configured.'}</p>${!currentUser() ? '<button class="button purple full" data-guide-action="signup">Create an account ↗</button>' : ''}</div>`}</section>`;
  const transcript = guideRoot.querySelector('.guide-transcript');
  transcript.scrollTop = transcript.scrollHeight;
}
guideRoot.addEventListener('input', event => { if (event.target.id === 'guide-message') guideDraft = event.target.value; });
guideRoot.addEventListener('click', event => {
  const action = event.target.closest('[data-guide-action]')?.dataset.guideAction;
  if (!action) return;
  if (action === 'signup') { guideOpen = false; guideRoot.innerHTML = ''; auth('signup'); return; }
  guideOpen = action === 'open';
  renderGuide();
  guideRoot.querySelector(guideOpen ? '#guide-message' : '.guide-launcher')?.focus();
});
guideRoot.addEventListener('keydown', event => {
  if (event.key === 'Escape' && guideOpen) { guideOpen = false; renderGuide(); guideRoot.querySelector('.guide-launcher')?.focus(); }
});
guideRoot.addEventListener('submit', async event => {
  if (event.target.id !== 'guide-form') return;
  event.preventDefault();
  if (guideBusy || !currentUser() || !guideDraft.trim()) return;
  const content = guideDraft.trim();
  const owner = currentUser().id;
  const messages = [...guideMessages.slice(-8), { role: 'user', content }];
  guideBusy = true; guidePending = content; guideDraft = ''; guideError = ''; renderGuide();
  try {
    const result = await api('/api/guide', { messages, ...(currentView === 'personal-lesson' ? { lesson: activeLesson.lessonRef } : {}) });
    if (typeof result.reply !== 'string') throw new Error('Your guide could not answer. Please try again.');
    if (currentUser()?.id === owner) guideMessages = [...messages, { role: 'assistant', content: result.reply }];
  } catch (error) {
    if (error instanceof AuthError) return handleFailure(error);
    if (currentUser()?.id === owner) { guideError = error.message; guideDraft = content; }
  }
  finally { guideBusy = false; guidePending = ''; renderGuide(); if (guideOpen) guideRoot.querySelector('#guide-message')?.focus(); }
});
function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be disabled. */ } }
function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function resetAccountState() {
  accountLoaded = false; answers = {}; description = ''; name = ''; personalLessons = {}; completedPersonalLessons = []; learningPlan = null;
  guideOpen = false; guideMessages = []; guideDraft = ''; guideError = ''; guidePending = '';
  shopDialog.close(); loadRewards();
}
// One place decides what a failure means: an expired login returns to the login form, anything else is a toast.
function handleFailure(error) {
  if (error instanceof AuthError) { resetAccountState(); renderGuide(); auth('login', error.message); window.scrollTo(0, 0); }
  else toast(error.message);
}
async function loadAccount() {
  const stopLoading = startLoading('Opening your learning path…');
  try {
    const { profile } = await api('/api/profile');
    personalLessons = {};
    name = currentUser()?.user_metadata?.name || '';
    accountLoaded = true;
    loadPersonalProgress(); loadRewards();
    if (!profile) { answers = {}; step = 0; questionnaire(); return; }
    answers = profile.answers; description = profile.description; learningPlan = profile.plan;
    // Accounts created before AI placement get a path now; the standard path covers any failure.
    if (!learningPlan) await personalizeAccount().catch(() => { learningPlan = fallbackLearningPlan(answers); });
    dashboard();
  } finally { stopLoading(); }
}
async function openAccount() {
  try { await loadAccount(); }
  catch (error) { home(); handleFailure(error); }
}
async function personalizeAccount() {
  const result = await api('/api/personalize', { answers });
  learningPlan = validLearningPlan(result.plan) ? result.plan : fallbackLearningPlan(answers);
  description = result.description;
}
async function finish() {
  if (busy || !validAnswers(answers)) return;
  busy = true;
  const stopLoading = startLoading('Finding your learning path…');
  const button = app.querySelector('[data-action="next"]'); button.disabled = true; button.textContent = 'Finding your path…';
  description = planDescription(answers);
  try {
    if (currentUser()) await personalizeAccount();
    else { learningPlan = fallbackLearningPlan(answers); store('fairylearn-preview', { answers, description }); }
    personalLessons = {}; if (currentUser()) loadPersonalProgress(); dashboard(); window.scrollTo(0, 0);
  } catch (error) { if (error instanceof AuthError) handleFailure(error); else { toast(error.message); questionnaire(); } }
  finally { busy = false; stopLoading(); }
}
app.addEventListener('click', async event => {
  const practiceButton = event.target.closest('[data-practice-quiz]');
  if (practiceButton) { if (!busy) { practiceQuiz(practiceButton.dataset.practiceQuiz); window.scrollTo(0, 0); } return; }
  const personalButton = event.target.closest('[data-personal-lesson]');
  if (personalButton) { if (!busy) await openPersonalLesson(personalButton.dataset.personalLevel, Number(personalButton.dataset.personalLesson), personalButton.dataset.personalId); return; }
  const moduleButton = event.target.closest('[data-module]');
  if (moduleButton) { if (busy) return; courseLesson(moduleButton.dataset.module); window.scrollTo(0, 0); return; }
  const quizChoice = event.target.closest('[data-quiz-choice]');
  if (quizChoice && quiz) { handleQuiz('choice', Number(quizChoice.dataset.quizChoice)); return; }
  const quizAction = event.target.closest('[data-quiz]');
  if (quizAction && quiz) { handleQuiz(quizAction.dataset.quiz); return; }
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
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  event.preventDefault();
  if (busy) return;
  if (action === 'shop') { openShop(); return; }
  if (action === 'open-guide') { guideOpen = true; renderGuide(); guideRoot.querySelector('#guide-message')?.focus(); return; }
  if (action === 'theme') { toggleTheme(); return; }
  if (action === 'fairy-tip') { const tip = app.querySelector('#fairy-tip'); const open = tip.hidden; tip.hidden = !open; fairyButton.setAttribute('aria-expanded', String(open)); return; }
  if (action === 'close-tip') { closeFairyTip(); fairyButton.focus(); return; }
  if (action === 'how' || action === 'paths') { home(); document.querySelector(action === 'how' ? '#how-it-works' : '#paths').scrollIntoView(); return; }
  if (action === 'home') home();
  if (action === 'course') courseHub();
  if (action === 'continue-path') { await continuePath(); return; }
  if (action === 'quizzes') quizHub();
  if (action === 'unit-test') unitTest(currentView === 'quizzes' ? 'quizzes' : 'course');
  if (action === 'complete-module' && activeLesson) {
    const module = activeLesson;
    if (!quiz || !quizPassed(quiz)) return;
    const reward = completionRewards();
    wallet = reward.wallet; saveRewards();
    const trophyNote = reward.earned ? ` +${reward.earned} trophies!` : ' Trophies already collected for this result.';
    if (module.id === UNIT_TEST_ID) {
      if (quizOrigin === 'quizzes') quizHub(); else courseHub();
      toast(`Unit test complete: ${quizScore(quiz)} of ${quiz.questions.length} points!${trophyNote}`);
    } else if (activeLessonIsPersonal) {
      completedPersonalLessons = [...new Set([...completedPersonalLessons, module.id])];
      store(personalProgressKey(), completedPersonalLessons);
      dashboard();
      toast(`Your personal lesson is complete!${trophyNote}`);
      if (config.aiLessonsEnabled && currentLearningPlan().lessons.filter(item => !completedPersonalLessons.includes(lessonKey(item))).length <= 2) await continuePath();
    } else if (currentView === 'practice-quiz') {
      quizHub();
      toast(`Quiz complete!${trophyNote}`);
    } else {
      completedModules = completedCourseIds([...completedModules, module.id]);
      store('fairylearn-course-progress', completedModules);
      if (currentView === 'practice-quiz') quizHub(); else courseHub();
      toast(`You earned the ${module.badge} badge!${trophyNote}`);
    }
  }
  if (action === 'signup' || action === 'login') auth(action);
  if (action === 'demo') { const saved = read('fairylearn-preview'); answers = saved?.answers || {}; learningPlan = null; step = 0; questionnaire(); }
  if (action === 'dashboard') { if (currentUser() && !accountLoaded) await openAccount(); else dashboard(); }
  if (action === 'retake') { step = 0; questionnaire(); }
  if (action === 'previous') { if (step) { step--; questionnaire(); document.querySelector('#question-title').focus({ preventScroll: true }); } else { home(); window.scrollTo(0, 0); } }
  if (action === 'next' && answers[questions[step].id]) { if (step < 4) { step++; questionnaire(); document.querySelector('#question-title').focus({ preventScroll: true }); } else await finish(); }
  if (action === 'logout') { accounts?.signOut(); resetAccountState(); home(); renderGuide(); }
  if (action !== 'next' && action !== 'previous') window.scrollTo(0, 0);
});
app.addEventListener('input', event => {
  if (!event.target.matches('[data-prompt-field]')) return;
  const values = Object.fromEntries([...app.querySelectorAll('[data-prompt-field]')].map(input => [input.dataset.promptField, input.value.trim()]));
  const preview = app.querySelector('.prompt-preview');
  preview.textContent = values.topic || values.task || values.grade
    ? `I am in grade ${values.grade || '___'}. Help me learn ${values.topic || '___'} by giving me ${values.task || '___'}. Ask one question at a time and explain any mistakes.`
    : 'Your prompt will appear here as you type.';
});
app.addEventListener('keydown', event => {
  if (event.key === 'Escape' && app.querySelector('#fairy-tip:not([hidden])')) { closeFairyTip(); fairyButton.focus(); return; }
  const option = event.target.closest('[data-option]');
  const choice = event.target.closest('[data-quiz-choice]');
  if (!option && !choice) return;
  const items = [...app.querySelectorAll(option ? '[data-option]' : '[data-quiz-choice]:not(:disabled)')];
  const index = items.indexOf(option || choice);
  const offset = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
  if (offset) { event.preventDefault(); const target = items[(index + offset + items.length) % items.length]; target.click(); target.focus({ preventScroll: true }); }
});
app.addEventListener('submit', async event => {
  if (event.target.id !== 'auth-form') return;
  event.preventDefault(); if (busy || !configured) return;
  const form = event.target; const fields = new FormData(form); const button = form.querySelector('[type="submit"]'); const error = form.querySelector('#form-error');
  busy = true; button.disabled = true; button.textContent = 'One little moment…'; error.textContent = '';
  const stopLoading = startLoading(form.dataset.mode === 'signup' ? 'Starting your story…' : 'Welcoming you back…');
  const signup = form.dataset.mode === 'signup';
  const email = String(fields.get('email')).trim();
  const password = String(fields.get('password'));
  try {
    if (signup) {
      const { needsConfirmation } = await accounts.signUp({ name: String(fields.get('name')).trim(), email, password, redirectTo: location.origin });
      if (needsConfirmation) { form.reset(); emailVerification(email); return; }
    } else await accounts.signIn({ email, password });
    await loadAccount();
  } catch (err) { error.textContent = err.message; }
  finally { busy = false; stopLoading(); button.disabled = false; button.textContent = signup ? 'Create my account ↗' : 'Log in ↗'; }
});

// Email confirmation links return here with the session (or an error) in the URL fragment.
if (accounts && /(^|[#&])(access_token|error)=/.test(location.hash)) {
  const hash = location.hash;
  history.replaceState(null, '', location.pathname + location.search);
  try { await accounts.completeRedirect(hash); } catch (error) { toast(error.message); }
}
if (currentUser()) await openAccount();
else home();
stopInitialLoading();
