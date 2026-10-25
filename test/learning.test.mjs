// Tests for public/learning.mjs: placement levels, answer validation and the path description.
// `answers` is a complete questionnaire for a brand-new learner.
import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevel, validAnswers, planDescription } from '../public/learning.mjs';
const answers = { experience: 'new', knowledge: 'unsure', goal: 'creative', format: 'visual', pace: '10' };
// A brand-new learner always starts at Starter, even with the knowledge check right.
test('new learners always have an accessible starting point', () => {
  assert.equal(getLevel(answers), 'Starter');
  assert.equal(getLevel({ ...answers, knowledge: 'generate' }), 'Starter');
});
// Each experience level maps to its own path, and a wrong knowledge check moves one level down.
test('experience and knowledge check determine all four paths', () => {
  for (const [experience, expected] of [['new', 'Starter'], ['curious', 'Beginner'], ['regular', 'Medium'], ['advanced', 'Expert']]) assert.equal(getLevel({ ...answers, experience, knowledge: 'generate' }), expected);
  assert.equal(getLevel({ ...answers, experience: 'advanced', knowledge: 'think' }), 'Medium');
});
// Answers must be complete and use real option values.
test('only complete answers from the available choices are accepted', () => {
  assert.equal(validAnswers(answers), true);
  assert.equal(validAnswers({ ...answers, pace: '999' }), false);
  assert.equal(validAnswers({ ...answers, format: undefined }), false);
  assert.equal(validAnswers(null), false);
});
// The description mentions the learner's goal and daily minutes.
test('fallback plan reflects the chosen goal and pace', () => {
  assert.match(planDescription(answers), /creative ideas/);
  assert.match(planDescription(answers), /10 minutes/);
});
