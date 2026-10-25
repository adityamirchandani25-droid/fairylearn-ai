// Khan Academy–style quizzes: one question at a time, optional hints, and retries until the
// learner finds the right answer. Only answers that are right on the first try without a hint
// count toward the score, unless a purchased perk protects the point. Shared by the browser
// and server so both validate quizzes the same way.
export const PASSING_SHARE = 0.8;
export const passingScore = total => Math.ceil(total * PASSING_SHARE);

const textWithin = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

export function validQuizQuestion(item) {
  return !!item && textWithin(item.question, 8, 300) &&
    Array.isArray(item.choices) && item.choices.length >= 3 && item.choices.length <= 4 &&
    item.choices.every(choice => textWithin(choice, 1, 220)) &&
    new Set(item.choices.map(choice => choice.trim().toLowerCase())).size === item.choices.length &&
    Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.choices.length &&
    textWithin(item.hint, 5, 300) && textWithin(item.explanation, 5, 600);
}

export function cleanQuizQuestion(item) {
  return { question: item.question.trim(), choices: item.choices.map(choice => choice.trim()), answer: item.answer, hint: item.hint.trim(), explanation: item.explanation.trim() };
}

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Choices are shuffled so the correct answer is not always in the same position.
export function createQuiz(questions, random = Math.random) {
  return {
    questions: questions.map(item => {
      const order = shuffle(item.choices.map((_, index) => index), random);
      return { ...item, choices: order.map(index => item.choices[index]), answer: order.indexOf(item.answer) };
    }),
    index: 0, selected: null, status: 'answering', hintShown: false, protectedHint: false, protectedRetry: false, eliminated: [], removed: [], results: []
  };
}

export function selectChoice(quiz, choice) {
  if (quiz.status === 'correct' || quiz.status === 'done' || quiz.eliminated.includes(choice) || quiz.removed.includes(choice)) return quiz;
  return { ...quiz, selected: choice, status: 'answering' };
}

export function checkAnswer(quiz) {
  if (quiz.status !== 'answering' || quiz.selected === null) return quiz;
  if (quiz.selected === quiz.questions[quiz.index].answer) {
    const earnsPoint = quiz.eliminated.length <= (quiz.protectedRetry ? 1 : 0) && (!quiz.hintShown || quiz.protectedHint);
    return { ...quiz, status: 'correct', results: [...quiz.results, earnsPoint] };
  }
  return { ...quiz, status: 'wrong', eliminated: [...quiz.eliminated, quiz.selected] };
}

export function showHint(quiz, protectedHint = false) {
  return quiz.status === 'done' || quiz.status === 'correct' || quiz.hintShown ? quiz : { ...quiz, hintShown: true, protectedHint };
}

export function protectRetry(quiz) {
  return quiz.status === 'wrong' && quiz.eliminated.length === 1 && !quiz.protectedRetry ? { ...quiz, protectedRetry: true } : quiz;
}

export function nextQuestion(quiz) {
  if (quiz.status !== 'correct') return quiz;
  const index = quiz.index + 1;
  if (index >= quiz.questions.length) return { ...quiz, status: 'done' };
  return { ...quiz, index, selected: null, status: 'answering', hintShown: false, protectedHint: false, protectedRetry: false, eliminated: [], removed: [] };
}

export const quizScore = quiz => quiz.results.filter(Boolean).length;
export const quizPassed = quiz => quiz.status === 'done' && quizScore(quiz) >= passingScore(quiz.questions.length);

export function removeDistractor(quiz) {
  if (['correct', 'done'].includes(quiz.status) || quiz.removed.length) return quiz;
  const item = quiz.questions[quiz.index];
  const index = item.choices.findIndex((_, index) => index !== item.answer && !quiz.eliminated.includes(index));
  return index < 0 ? quiz : { ...quiz, removed: [index], selected: quiz.selected === index ? null : quiz.selected };
}
export function mixedQuestions(modules, total = 10, random = Math.random) {
  const banks = modules.map(module => shuffle(module.quiz, random));
  const result = [];
  for (let row = 0; result.length < total && banks.some(bank => row < bank.length); row++)
    for (const bank of banks) if (row < bank.length && result.length < total) result.push(bank[row]);
  return shuffle(result, random);
}
