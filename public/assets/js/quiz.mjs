// quiz.mjs (browser) — runs the /quiz page. All quiz rules come from the app's own pure
// functions in /quiz.mjs and the questions from /course.mjs, so scoring here matches the app:
// keep trying until the answer clicks; a point counts only when it was right on the first try
// without a hint. Only a best score per topic is stored, under a key the app never reads.
import { createQuiz, selectChoice, checkAnswer, showHint, nextQuestion, quizScore, quizPassed, passingScore, mixedQuestions } from '/quiz.mjs';
import { courseModules } from '/course.mjs';

const card = document.querySelector('[data-quiz]');
const live = document.querySelector('[data-quiz-live]');
const topicButtons = [...document.querySelectorAll('[data-topic]')];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BEST_KEY = 'fairylearn-site-quiz-best';
const MIXED_TOTAL = 10;
const letters = ['A', 'B', 'C', 'D'];

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const svg = body => `<svg class="icon icon-16" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const icons = {
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  cross: svg('<path d="m7 7 10 10M17 7 7 17"/>'),
  hint: svg('<path d="M9 17.5h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9v1.7h5v-1.7c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3Z"/>'),
  chev: '<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
  back: '<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8 10 12.5"/></svg>'
};

const topics = Object.fromEntries([
  ...courseModules.map(module => [module.id, { id: module.id, title: module.title, kicker: (module.category.charAt(0) + module.category.slice(1).toLowerCase()).replace(/\bai\b/gi, 'AI'), url: `/lessons/${module.title.toLowerCase().replace(/[’'?]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, questions: () => module.quiz }]),
  ['mixed', { id: 'mixed', title: 'Mixed challenge', kicker: 'All three lessons', url: '/lessons', questions: () => mixedQuestions(courseModules, MIXED_TOTAL) }]
]);
const order = [...courseModules.map(module => module.id), 'mixed'];

let topic = null;
let quiz = null;
let firstRender = true;

const readBest = () => { try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {}; } catch { return {}; } };
const saveBest = (id, score, total) => {
  try {
    const best = readBest();
    if (!best[id] || score / total > best[id].score / best[id].total) best[id] = { score, total };
    localStorage.setItem(BEST_KEY, JSON.stringify(best));
  } catch { /* storage unavailable: nothing to remember */ }
};

// One polite live region outside the card, so a screen reader hears the change (not the whole
// card again on every click).
const say = text => { if (!live) return; live.textContent = ''; requestAnimationFrame(() => { live.textContent = text; }); };
const navOffset = () => (document.querySelector('[data-nav]')?.getBoundingClientRect().bottom || 0) + 16;
const behavior = () => reduceMotion ? 'auto' : 'smooth';
// Bring the top of the card back under the nav, but only when it has scrolled out of view, so a
// new question never yanks a page that is already showing it.
const revealCard = () => {
  const top = card.getBoundingClientRect().top;
  if (top < navOffset()) scrollTo({ top: scrollY + top - navOffset(), behavior: behavior() });
};
// Keep the action row (Check / Next) on screen after feedback or a hint grows the card.
const revealActions = () => {
  const actions = card.querySelector('.quiz-actions');
  if (!actions) return;
  const bottom = actions.getBoundingClientRect().bottom + 24;
  if (bottom > innerHeight) scrollTo({ top: scrollY + bottom - innerHeight, behavior: behavior() });
};

function start(id, { focus = false } = {}) {
  topic = topics[id] || topics[order[0]];
  quiz = createQuiz(topic.questions());
  topicButtons.forEach(button => {
    const on = button.dataset.topic === topic.id;
    button.setAttribute('aria-checked', String(on));
    button.tabIndex = on ? 0 : -1;
  });
  const url = new URL(location.href);
  url.searchParams.set('lesson', topic.id);
  history.replaceState(null, '', url);
  render({ transition: !firstRender, focusQuestion: focus });
  if (!firstRender) say(`${topic.title}. Question 1 of ${quiz.questions.length}.`);
  firstRender = false;
}

function header() {
  const total = quiz.questions.length;
  const position = quiz.status === 'done' ? total : quiz.index + 1;
  const done = quiz.status === 'done' ? total : quiz.index + (quiz.status === 'correct' ? 1 : 0);
  return `<div class="quiz-head">
    <span class="quiz-kicker">${escape(topic.kicker)} · ${escape(topic.title)}</span>
    <span class="quiz-count t-tnum">${quiz.status === 'done' ? 'Results' : `Question ${position} of ${total}`}</span>
  </div>
  <div class="quiz-bar" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><i style="transform: scaleX(${done / total})"></i></div>`;
}

function questionView() {
  const item = quiz.questions[quiz.index];
  const solved = quiz.status === 'correct';
  const choices = item.choices.map((choice, i) => {
    const wrong = quiz.eliminated.includes(i);
    const right = solved && i === item.answer;
    const selected = quiz.selected === i && !wrong;
    const state = right ? ' is-correct' : wrong ? ' is-wrong' : selected ? ' is-selected' : '';
    const disabled = solved || wrong;
    const focusable = selected || (quiz.selected === null && i === item.choices.findIndex((_, j) => !quiz.eliminated.includes(j)));
    return `<button class="quiz-choice${state}" type="button" role="radio" aria-checked="${selected || right}" data-choice="${i}"${disabled ? ' aria-disabled="true"' : ''} tabindex="${focusable && !disabled ? 0 : -1}">
      <span class="quiz-choice-key" aria-hidden="true">${right ? icons.check : wrong ? icons.cross : letters[i]}</span>
      <span class="quiz-choice-text">${escape(choice)}</span>
      ${wrong ? '<span class="sr-only">(not this one)</span>' : ''}${right ? '<span class="sr-only">(correct)</span>' : ''}
    </button>`;
  }).join('');

  let feedback = '';
  if (quiz.status === 'wrong') feedback = `<div class="quiz-feedback is-wrong" role="status"><span class="label-mono is-neutral">Not quite</span><p>That one’s crossed out. Try another answer${quiz.hintShown ? '' : ', or take a hint'}.</p></div>`;
  if (solved) {
    const earned = quiz.results[quiz.results.length - 1];
    feedback = `<div class="quiz-feedback is-correct" role="status"><div class="quiz-feedback-labels"><span class="label-mono">Correct</span>${earned ? '' : `<span class="label-mono is-neutral">${quiz.hintShown ? 'Hint used · no point' : 'Second try · no point'}</span>`}</div><p>${escape(item.explanation)}</p></div>`;
  }
  const hint = quiz.hintShown && !solved ? `<div class="quiz-hint">${icons.hint}<p><span class="sr-only">Hint: </span>${escape(item.hint)}</p></div>` : '';
  const last = quiz.index === quiz.questions.length - 1;
  const actions = solved
    ? `<button class="btn btn-dark btn-md" type="button" data-action="next"><span>${last ? 'See results' : 'Next question'}</span>${icons.chev}</button>`
    : `<button class="btn btn-dark btn-md" type="button" data-action="check"${quiz.selected === null || quiz.status === 'wrong' ? ' aria-disabled="true"' : ''}><span>Check</span></button>
       ${quiz.hintShown ? '' : `<button class="btn btn-outline" type="button" data-action="hint">${icons.hint}<span>Hint</span></button>`}`;

  return `${header()}
  <div class="quiz-body">
    <h2 class="quiz-question" id="quiz-question" tabindex="-1" data-quiz-question>${escape(item.question)}</h2>
    <div class="quiz-choices" role="radiogroup" aria-labelledby="quiz-question">${choices}</div>
    ${hint}${feedback}
    <div class="quiz-actions">${actions}</div>
  </div>`;
}

function resultsView() {
  const total = quiz.questions.length;
  const score = quizScore(quiz);
  const passed = quizPassed(quiz);
  const nextId = order[(order.indexOf(topic.id) + 1) % order.length];
  const next = topics[nextId];
  const best = readBest()[topic.id];
  return `${header()}
  <div class="quiz-body quiz-results">
    <div class="quiz-score">
      <p class="quiz-score-num t-tnum" aria-label="${score} of ${total} points"><span data-score data-target="${score}">${reduceMotion ? score : 0}</span><span class="quiz-score-total">/${total}</span></p>
      <div class="quiz-score-copy">
        ${passed ? '<span class="label-mono">Passed</span>' : `<span class="label-mono is-neutral">${passingScore(total)} of ${total} to pass</span>`}
        <h2 class="quiz-question" tabindex="-1" data-quiz-question>${passed ? 'Nicely done. That one stuck.' : 'A good start. Want another go?'}</h2>
        <p>Points count when the first answer is right without a hint.${best ? ` Your best here: ${best.score} of ${best.total}.` : ''}</p>
      </div>
    </div>
    <ol class="quiz-recap">
      ${quiz.questions.map((item, i) => `<li class="${quiz.results[i] ? 'is-earned' : ''}"><span class="quiz-recap-mark" aria-hidden="true">${quiz.results[i] ? icons.check : '<i></i>'}</span><span class="quiz-recap-q">${escape(item.question)}</span><span class="quiz-recap-state">${quiz.results[i] ? 'Point' : 'No point'}</span></li>`).join('')}
    </ol>
    <div class="quiz-actions">
      <button class="btn btn-dark btn-md" type="button" data-action="retry"><span>Try again</span></button>
      ${topic.id === 'mixed'
        ? `<a class="btn btn-outline" href="/lessons"><span>Back to lessons</span>${icons.chev}</a>`
        : `<button class="btn btn-outline" type="button" data-action="topic" data-target-topic="${next.id}"><span>${next.id === 'mixed' ? 'Try the mixed challenge' : `Next: ${escape(next.title)}`}</span>${icons.chev}</button>`}
      ${topic.id === 'mixed' ? '' : `<a class="quiz-text-link link" href="${topic.url}">Review the lesson</a>`}
    </div>
    <p class="quiz-next-step">Want quizzes for every lesson on your own path? <a class="link" href="/signup">Start free</a> or <a class="link" href="/paths">see the four levels</a>.</p>
  </div>`;
}

function countScore() {
  const el = card.querySelector('[data-score]');
  if (!el || reduceMotion) return;
  const target = Number(el.dataset.target);
  const begin = performance.now();
  const step = now => {
    const t = Math.min(1, (now - begin) / 900);
    el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function render({ transition = false, focusQuestion = false } = {}) {
  const paint = () => {
    card.innerHTML = quiz.status === 'done' ? resultsView() : questionView();
    card.classList.toggle('is-results', quiz.status === 'done');
    if (quiz.status === 'done') countScore();
    if (focusQuestion) {
      card.querySelector('[data-quiz-question]')?.focus({ preventScroll: true });
      revealCard();
    }
  };
  if (!transition || reduceMotion) return paint();
  card.classList.add('is-leaving');
  setTimeout(() => {
    paint();
    card.classList.remove('is-leaving');
    card.classList.add('is-entering');
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-entering')));
  }, 180);
}

function update(next, options) {
  if (next === quiz) return;
  const wasDone = quiz.status === 'done';
  quiz = next;
  if (quiz.status === 'done' && !wasDone) saveBest(topic.id, quizScore(quiz), quiz.questions.length);
  render(options);
}

card.addEventListener('click', event => {
  if (card.classList.contains('is-leaving')) return;
  const choice = event.target.closest('[data-choice]');
  if (choice) {
    if (choice.getAttribute('aria-disabled') === 'true') return;
    update(selectChoice(quiz, Number(choice.dataset.choice)));
    card.querySelector(`[data-choice="${choice.dataset.choice}"]`)?.focus();
    return;
  }
  const action = event.target.closest('[data-action]');
  if (!action || action.getAttribute('aria-disabled') === 'true') return;
  const name = action.dataset.action;
  if (name === 'check') {
    update(checkAnswer(quiz));
    const item = quiz.questions[quiz.index];
    if (quiz.status === 'correct') say(`Correct. ${item.explanation}`);
    else if (quiz.status === 'wrong') say('Not quite. That answer is crossed out. Try another.');
    (card.querySelector('[data-action="next"]') || card.querySelector('[data-choice]:not([aria-disabled="true"])'))?.focus({ preventScroll: true });
    revealActions();
  }
  if (name === 'hint') {
    update(showHint(quiz));
    say(`Hint: ${quiz.questions[quiz.index].hint}`);
    card.querySelector('[data-choice]:not([aria-disabled="true"])[tabindex="0"]')?.focus({ preventScroll: true });
    revealActions();
  }
  if (name === 'next') {
    update(nextQuestion(quiz), { transition: true, focusQuestion: true });
    say(quiz.status === 'done' ? `Results: ${quizScore(quiz)} of ${quiz.questions.length} points.` : `Question ${quiz.index + 1} of ${quiz.questions.length}.`);
  }
  if (name === 'retry') {
    quiz = createQuiz(topic.questions());
    render({ transition: true, focusQuestion: true });
    say(`Starting again. Question 1 of ${quiz.questions.length}.`);
  }
  if (name === 'topic') start(action.dataset.targetTopic, { focus: true });
});

// Arrow keys move through choices like a radio group (and select, matching native radios).
card.addEventListener('keydown', event => {
  const choice = event.target.closest('[data-choice]');
  if (!choice) return;
  const offset = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 0;
  if (!offset) return;
  event.preventDefault();
  const items = [...card.querySelectorAll('[data-choice]:not([aria-disabled="true"])')];
  if (!items.length) return;
  const target = items[(items.indexOf(choice) + offset + items.length) % items.length];
  update(selectChoice(quiz, Number(target.dataset.choice)));
  card.querySelector(`[data-choice="${target.dataset.choice}"]`)?.focus();
});

topicButtons.forEach((button, i) => {
  button.addEventListener('click', () => { if (button.dataset.topic !== topic?.id) start(button.dataset.topic); });
  button.addEventListener('keydown', event => {
    const offset = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 0;
    if (!offset) return;
    event.preventDefault();
    const target = topicButtons[(i + offset + topicButtons.length) % topicButtons.length];
    target.focus();
    start(target.dataset.topic);
  });
});

start(new URLSearchParams(location.search).get('lesson') || order[0]);
