import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevel, validAnswers, planDescription } from '../public/learning.mjs';
const answers = { experience: 'new', knowledge: 'unsure', goal: 'creative', format: 'visual', pace: '10' };
test('new learners always have an accessible starting point', () => {
  assert.equal(getLevel(answers), 'Starter');
  assert.equal(getLevel({ ...answers, knowledge: 'generate' }), 'Starter');
});
test('experience and knowledge check determine all four paths', () => {
  for (const [experience, expected] of [['new', 'Starter'], ['curious', 'Beginner'], ['regular', 'Medium'], ['advanced', 'Expert']]) assert.equal(getLevel({ ...answers, experience, knowledge: 'generate' }), expected);
  assert.equal(getLevel({ ...answers, experience: 'advanced', knowledge: 'think' }), 'Medium');
});
test('only complete answers from the available choices are accepted', () => {
  assert.equal(validAnswers(answers), true);
  assert.equal(validAnswers({ ...answers, pace: '999' }), false);
  assert.equal(validAnswers({ ...answers, format: undefined }), false);
  assert.equal(validAnswers(null), false);
});
test('fallback plan reflects the chosen goal and pace', () => {
  assert.match(planDescription(answers), /creative ideas/);
  assert.match(planDescription(answers), /10 minutes/);
});
