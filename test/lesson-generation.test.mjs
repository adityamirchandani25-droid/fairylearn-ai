import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePersonalLesson, validateGeneratedLesson } from '../lesson-generation.mjs';
import { findPathLesson } from '../public/path-lessons.mjs';

const answers = { experience: 'curious', knowledge: 'generate', goal: 'creative', format: 'guided', pace: '10' };
const lesson = {
  summary: 'A friendly introduction shaped around creative projects and guided practice.',
  sections: [
    { title: 'First idea', text: 'A model learns patterns from examples, then uses those patterns when it encounters a new prompt or situation. A clear example helps you see what the model can and cannot do.' },
    { title: 'Second idea', text: 'When you ask an AI tool for help, giving it a specific task and useful context often leads to a more helpful response. You should still inspect what it says.' },
    { title: 'Third idea', text: 'An AI answer can sound confident and still be wrong. Check important claims with a reliable source, and follow your teacher’s rules for using AI in class.' }
  ],
  task: 'Write one clear prompt for a creative project, then check whether the response follows your instructions.',
  question: 'What should you do after an AI tool gives you a surprising factual claim?',
  choices: ['Check the claim with a reliable source.', 'Accept it because it sounds confident.', 'Ask it to repeat the claim loudly.'],
  answer: 0,
  feedback: 'Checking a reliable source is the best way to test an AI-generated factual claim.'
};

test('lesson generation sends a structured, private request based on approved profile choices', async () => {
  let request;
  const result = await generatePersonalLesson({
    apiKey: 'test-only-key', level: 'Beginner', topic: 'The art of a good prompt', answers,
    fetchImpl: async (_url, options) => {
      request = options;
      return { ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(lesson) }] }] }) };
    }
  });
  const body = JSON.parse(request.body);
  assert.equal(body.store, false);
  assert.equal(body.text.format.type, 'json_schema');
  assert.equal(body.text.format.strict, true);
  assert.match(body.input, /Bring my ideas to life/);
  assert.equal(result.answer, 0);
  assert.equal(result.sections.length, 3);
});

test('malformed AI lessons cannot unlock an incorrect quiz', () => {
  assert.throws(() => validateGeneratedLesson({ ...lesson, answer: 4 }), /incomplete lesson/);
  assert.throws(() => validateGeneratedLesson({ ...lesson, sections: [] }), /incomplete lesson/);
  assert.throws(() => validateGeneratedLesson({ ...lesson, choices: ['Same answer', 'Same answer', 'Same answer'] }), /incomplete lesson/);
});

test('lesson requests can only select approved level topics', () => {
  assert.equal(findPathLesson('Starter', 0)?.title, 'Hello, artificial intelligence');
  assert.equal(findPathLesson('Expert', 2)?.title, 'Evaluating responsible AI systems');
  assert.equal(findPathLesson('Custom', 0), undefined);
  assert.equal(findPathLesson('Starter', 12), undefined);
  assert.equal(findPathLesson('Starter', '0'), undefined);
});
