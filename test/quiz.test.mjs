import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuiz, selectChoice, checkAnswer, showHint, nextQuestion, quizScore, quizPassed, passingScore, validQuizQuestion, mixedQuestions, removeDistractor } from '../public/quiz.mjs';
import { courseModules } from '../public/course.mjs';

const question = (answer = 1) => ({ question: 'Which prompt is clearest?', choices: ['A', 'B', 'C', 'D'], answer, hint: 'Look for context.', explanation: 'B gives context.' });
const keepOrder = () => 0.999; // Shuffling with this value leaves the order unchanged.

test('choices are shuffled while the correct answer still points at the same text', () => {
  let seed = 0.3;
  const quiz = createQuiz([question()], () => (seed = (seed * 9301 + 0.49297) % 1));
  const [item] = quiz.questions;
  assert.equal(item.choices[item.answer], 'B');
  assert.deepEqual([...item.choices].sort(), ['A', 'B', 'C', 'D']);
});

test('learners retry until correct, and only first-try answers without hints score', () => {
  let quiz = createQuiz([question(), question(), question()], keepOrder);
  quiz = checkAnswer(selectChoice(quiz, 1));
  assert.equal(quiz.status, 'correct');
  quiz = nextQuestion(quiz);

  quiz = checkAnswer(selectChoice(quiz, 0));
  assert.equal(quiz.status, 'wrong');
  assert.deepEqual(quiz.eliminated, [0]);
  assert.equal(selectChoice(quiz, 0), quiz, 'an eliminated choice cannot be picked again');
  assert.equal(nextQuestion(quiz), quiz, 'cannot skip ahead before finding the answer');
  quiz = nextQuestion(checkAnswer(selectChoice(quiz, 1)));

  quiz = checkAnswer(selectChoice(showHint(quiz), 1));
  quiz = nextQuestion(quiz);
  assert.equal(quiz.status, 'done');
  assert.deepEqual(quiz.results, [true, false, false]);
  assert.equal(quizScore(quiz), 1);
  assert.equal(quizPassed(quiz), false);
});

test('passing needs at least 80% right on the first try', () => {
  assert.equal(passingScore(4), 4);
  assert.equal(passingScore(6), 5);
  let quiz = createQuiz([question(), question(), question(), question(), question()], keepOrder);
  for (const choice of [1, 1, 1, 1, 0]) {
    quiz = checkAnswer(selectChoice(quiz, choice));
    if (quiz.status === 'wrong') quiz = checkAnswer(selectChoice(quiz, 1));
    quiz = nextQuestion(quiz);
  }
  assert.equal(quizScore(quiz), 4);
  assert.equal(quizPassed(quiz), true);
});

test('every public lesson has a valid five-question quiz', () => {
  for (const module of courseModules) {
    assert.equal(module.quiz.length, 5, module.id);
    assert.ok(module.quiz.every(validQuizQuestion), module.id);
  }
  assert.equal(validQuizQuestion({ ...question(), answer: 4 }), false);
  assert.equal(validQuizQuestion({ ...question(), choices: ['Same', 'same', 'Other'] }), false);
  assert.equal(validQuizQuestion({ ...question(), hint: '' }), false);
});

test('the mixed quiz has ten distinct questions across all topics', () => {
  const mixed = mixedQuestions(courseModules, 10, keepOrder);
  assert.equal(mixed.length, 10);
  assert.equal(new Set(mixed.map(item => item.question)).size, 10);
  assert.ok(courseModules.every(module => mixed.some(item => module.quiz.includes(item))));
});
test('a Clarity Token removes a distractor without changing the score or allowing repeated removal', () => {
  let quiz = createQuiz([question()], keepOrder);
  quiz = removeDistractor(quiz);
  assert.equal(quiz.removed.length, 1);
  assert.notEqual(quiz.removed[0], quiz.questions[0].answer);
  assert.equal(selectChoice(quiz, quiz.removed[0]), quiz);
  assert.equal(removeDistractor(quiz), quiz);
  quiz = checkAnswer(selectChoice(quiz, quiz.questions[0].answer));
  assert.equal(quizScore(quiz), 1);
});
