// Khan Academy–style quizzes: one question at a time, optional hints, and retries until the
// learner finds the right answer. Only answers that are right on the first try without a hint
// count toward the score, unless a purchased perk protects the point. Shared by the browser
// and server so both validate quizzes the same way.
//
// How this file is organised: every function takes a quiz state object and returns a NEW
// state object instead of changing the old one ("immutable updates"). The page simply
// re-renders from the latest state. This makes the logic easy to test (see test/quiz.test.mjs)
// and impossible to half-update. When an action is not allowed right now (for example
// checking before choosing an answer), the function returns the same object unchanged.
//
// Passing rule: a learner needs 80% of the points, rounded up. With 5 questions that is 4,
// with 10 questions it is 8.
export const PASSING_SHARE = 0.8;
export const passingScore = total => Math.ceil(total * PASSING_SHARE);

// True when `value` is a string whose trimmed length is between min and max characters.
const textWithin = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

// Checks that one question is safe to show and grade:
//   - question text of a sensible length;
//   - 3 or 4 choices, each non-empty, with no duplicates (ignoring case and spaces);
//   - `answer` is a whole number pointing at one of the choices (0 = the first choice);
//   - a hint and an explanation are both present.
// The server uses this to filter AI-written questions; the tests use it on the built-in lessons.
export function validQuizQuestion(item) {
  return !!item && textWithin(item.question, 8, 300) &&
    Array.isArray(item.choices) && item.choices.length >= 3 && item.choices.length <= 4 &&
    item.choices.every(choice => textWithin(choice, 1, 220)) &&
    new Set(item.choices.map(choice => choice.trim().toLowerCase())).size === item.choices.length &&
    Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.choices.length &&
    textWithin(item.hint, 5, 300) && textWithin(item.explanation, 5, 600);
}

// Returns a tidy copy of a valid question: whitespace trimmed and any extra fields dropped.
export function cleanQuizQuestion(item) {
  return { question: item.question.trim(), choices: item.choices.map(choice => choice.trim()), answer: item.answer, hint: item.hint.trim(), explanation: item.explanation.trim() };
}

// Fisher–Yates shuffle: walk backwards through a copy of the list, swapping each item with a
// random item at or before it. Every order is equally likely. The original list is untouched.
// `random` can be replaced by tests with a predictable function.
export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

//
// Builds a fresh quiz state from a list of questions. The state fields are:
//   questions      — the questions, each with its choices shuffled and `answer` updated so it
//                    still points at the correct choice's new position;
//   index          — which question is showing (0 = the first);
//   selected       — the choice the learner has picked but not checked yet (null = none);
//   status         — 'answering' (choosing), 'wrong' (last check was wrong), 'correct'
//                    (current question solved) or 'done' (results screen);
//   hintShown      — whether the hint for the current question was revealed;
//   protectedHint  — a Hint Pass was used, so the hint does not cost the point;
//   protectedRetry — a Retry Charm was used, so one wrong try does not cost the point;
//   eliminated     — choices already checked and found wrong for this question;
//   removed        — choices taken away by a Clarity Token (not counted as wrong tries);
//   results        — one true/false per finished question: true means "point earned".
// Choices are shuffled so the correct answer is not always in the same position.
export function createQuiz(questions, random = Math.random) {
  return {
    questions: questions.map(item => {
      // `order` is a shuffled list of original positions, e.g. [2, 0, 3, 1]. The new choices are
      // read in that order, and the correct answer's new position is wherever its old index landed.
      const order = shuffle(item.choices.map((_, index) => index), random);
      return { ...item, choices: order.map(index => item.choices[index]), answer: order.indexOf(item.answer) };
    }),
    index: 0, selected: null, status: 'answering', hintShown: false, protectedHint: false, protectedRetry: false, eliminated: [], removed: [], results: []
  };
}

// The learner clicks a choice. Ignored when the question is already solved, the quiz is over,
// or that choice was eliminated or removed. Picking a new choice after a wrong answer moves
// the status back to 'answering', so the Check button works again.
export function selectChoice(quiz, choice) {
  if (quiz.status === 'correct' || quiz.status === 'done' || quiz.eliminated.includes(choice) || quiz.removed.includes(choice)) return quiz;
  return { ...quiz, selected: choice, status: 'answering' };
}

// The learner presses Check.
//   - Right answer → status 'correct', and a result is recorded for this question.
//   - Wrong answer → status 'wrong', and that choice is added to `eliminated` (crossed out).
// The learner can keep trying until they find the right answer, as in Khan Academy, but the
// point is only earned when the answer was right on the first try without an unprotected hint.
export function checkAnswer(quiz) {
  if (quiz.status !== 'answering' || quiz.selected === null) return quiz;
  if (quiz.selected === quiz.questions[quiz.index].answer) {
    // Point rules: no wrong tries (or exactly one, if a Retry Charm protected it), and either no
    // hint or a hint covered by a Hint Pass.
    const earnsPoint = quiz.eliminated.length <= (quiz.protectedRetry ? 1 : 0) && (!quiz.hintShown || quiz.protectedHint);
    return { ...quiz, status: 'correct', results: [...quiz.results, earnsPoint] };
  }
  return { ...quiz, status: 'wrong', eliminated: [...quiz.eliminated, quiz.selected] };
}

// Reveals the hint for the current question. A free hint means this question will not earn a
// point; showHint(quiz, true) is used after spending a Hint Pass, which protects the point.
// Nothing happens once the question is solved or the hint is already showing.
export function showHint(quiz, protectedHint = false) {
  return quiz.status === 'done' || quiz.status === 'correct' || quiz.hintShown ? quiz : { ...quiz, hintShown: true, protectedHint };
}

// Applies a Retry Charm. It only works right after the very first wrong try on a question,
// and only once per question.
export function protectRetry(quiz) {
  return quiz.status === 'wrong' && quiz.eliminated.length === 1 && !quiz.protectedRetry ? { ...quiz, protectedRetry: true } : quiz;
}

// Moves on after a correct answer: to the next question with every per-question field reset,
// or to the results screen ('done') after the last question.
export function nextQuestion(quiz) {
  if (quiz.status !== 'correct') return quiz;
  const index = quiz.index + 1;
  if (index >= quiz.questions.length) return { ...quiz, status: 'done' };
  return { ...quiz, index, selected: null, status: 'answering', hintShown: false, protectedHint: false, protectedRetry: false, eliminated: [], removed: [] };
}

// quizScore: how many points were earned. quizPassed: finished, with at least the passing score.
export const quizScore = quiz => quiz.results.filter(Boolean).length;
export const quizPassed = quiz => quiz.status === 'done' && quizScore(quiz) >= passingScore(quiz.questions.length);

// Clarity Token: removes one wrong choice from the current question. It picks the first choice
// that is neither the correct answer nor already eliminated. A removed choice is not a wrong
// try, so the point is still available. Only one removal per question; if the learner had
// selected the removed choice, the selection is cleared.
export function removeDistractor(quiz) {
  if (['correct', 'done'].includes(quiz.status) || quiz.removed.length) return quiz;
  const item = quiz.questions[quiz.index];
  const index = item.choices.findIndex((_, index) => index !== item.answer && !quiz.eliminated.includes(index));
  return index < 0 ? quiz : { ...quiz, removed: [index], selected: quiz.selected === index ? null : quiz.selected };
}
// Builds the mixed challenge (unit test) from several lessons' quizzes.
// Each lesson's questions are shuffled into a "bank". We then take one question from each bank
// in turn (round-robin: lesson 1, lesson 2, lesson 3, lesson 1, ...) until `total` questions
// are chosen. This spreads the questions evenly across topics and never repeats a question.
// Finally the chosen questions are shuffled so the topics are mixed together.
export function mixedQuestions(modules, total = 10, random = Math.random) {
  const banks = modules.map(module => shuffle(module.quiz, random));
  const result = [];
  for (let row = 0; result.length < total && banks.some(bank => row < bank.length); row++)
    for (const bank of banks) if (row < bank.length && result.length < total) result.push(bank[row]);
  return shuffle(result, random);
}
