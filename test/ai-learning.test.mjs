// Tests for ai-learning.mjs. OpenAI is never called; each test passes a fake fetchImpl.
// `reply(text)` wraps text in the shape of an OpenAI Responses API result.
import test from 'node:test';
import assert from 'node:assert/strict';
import { askAI, createLearningPlan, extendLearningPlan, reasoningOptions, validGuideMessages } from '../ai-learning.mjs';
import { fallbackLearningPlan, validLearningPlan, findPathLesson, pathLessons, resolvePlanLesson } from '../public/path-lessons.mjs';

const answers = { experience: 'curious', knowledge: 'generate', goal: 'creative', format: 'guided', pace: '10' };
const reply = value => ({ ok: true, json: async () => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: value }] }] }) });

// Paths can grow forever: ten chapters of six new topics are added to the 10-stop standard
// path (70 stops), every new stop gets a unique id, and only ids on this path resolve.
test('AI chapters can extend beyond the starter catalog and resolve generated lesson IDs', async () => {
  let plan = fallbackLearningPlan(answers);
  for (let batch = 0; batch < 10; batch++) {
    plan = await extendLearningPlan({ answers, plan, apiKey: 'test-only', model: 'gpt-5-nano', fetchImpl: async () => reply(JSON.stringify({ lessons: Array.from({ length: 6 }, (_, index) => ({ level: 'Beginner', title: `Creative AI exploration ${batch}-${index}`, objective: 'Practice evaluating AI outputs in a new creative project.' })) })) });
  }
  assert.equal(plan.lessons.length, 70);
  assert.equal(validLearningPlan(plan), true);
  assert.equal(new Set(plan.lessons.map(item => item.id).filter(Boolean)).size, 60);
  const last = plan.lessons.at(-1);
  assert.equal(resolvePlanLesson(plan, { id: last.id }).title, last.title);
  assert.equal(resolvePlanLesson(plan, { id: 'ai:00000000-0000-4000-8000-000000000000' }), undefined);
});

// A chapter with too few lessons, a repeated title, or objectives that are too short is
// rejected as a whole; the existing path is left unchanged.
test('new chapters reject repeated titles and invalid objectives instead of appending them', async () => {
  const plan = fallbackLearningPlan(answers);
  const base = Array.from({ length: 6 }, (_, index) => ({ level: 'Beginner', title: `Creative exploration number ${index}`, objective: 'Practice checking an AI output in a creative project.' }));
  for (const invalid of [base.slice(0, 5), [{ ...base[0], title: pathLessons.Beginner[0].title }, ...base.slice(1)], base.map(item => ({ ...item, objective: 'short' }))]) {
    await assert.rejects(extendLearningPlan({ answers, plan, apiKey: 'test-only', model: 'gpt-5-nano', fetchImpl: async () => reply(JSON.stringify({ lessons: invalid })) }));
  }
  assert.equal(plan.lessons.length, 10);
});

// The 40-topic catalog, the standard path, and the plan checks that reject unknown, repeated or
// empty lesson lists. Also checks that "__proto__" cannot be used as a level.
test('expanded paths have valid fallback stops and reject invented or duplicate topics', () => {
  assert.equal(Object.values(pathLessons).flat().length, 40);
  const plan = fallbackLearningPlan(answers);
  assert.equal(plan.level, 'Beginner');
  assert.equal(plan.ai, false);
  assert.equal(validLearningPlan(plan), true);
  assert.equal(findPathLesson('Expert', 9)?.title, 'Planning a responsible AI product');
  assert.equal(findPathLesson('__proto__', 0), undefined);
  assert.equal(validLearningPlan({ ...plan, lessons: [...plan.lessons.slice(1), plan.lessons[1]] }), false);
  assert.equal(validLearningPlan({ ...plan, lessons: [...plan.lessons.slice(1), { level: 'Expert', index: 500 }] }), false);
  assert.equal(validLearningPlan({ ...plan, lessons: [] }), false);
});

// AI placement may choose a different level and mix levels, uses strict structured output and
// private requests, and never sends fields that are not questionnaire answers.
test('AI can select a different starting level and a mixed sequence from the approved catalog', async () => {
  const plan = { level: 'Starter', description: 'Start by building a solid foundation, then try a creative project.', lessons: [
    ...fallbackLearningPlan({ ...answers, experience: 'new' }).lessons.slice(0, 8),
    { level: 'Beginner', index: 3 }, { level: 'Beginner', index: 9 }
  ] };
  let request;
  const result = await createLearningPlan({ apiKey: 'test-only', model: 'gpt-5-nano', answers: { ...answers, secret: 'must-not-be-sent' }, fetchImpl: async (_url, options) => {
    request = JSON.parse(options.body);
    return reply(JSON.stringify(plan));
  } });
  assert.equal(result.level, 'Starter');
  assert.equal(result.ai, true);
  assert.equal(result.lessons.at(-1).level, 'Beginner');
  assert.equal(request.text.format.strict, true);
  assert.equal(request.store, false);
  assert.equal(request.reasoning.effort, 'low');
  assert.equal(request.input.includes('must-not-be-sent'), false);
  assert.match(request.input, /Planning a responsible AI product/);
});

// Unreadable JSON, invalid plans, cut-off replies and OpenAI errors are all reported as errors.
test('incomplete, malformed, and invented AI plans fail validation', async () => {
  const base = { apiKey: 'test-only', model: 'gpt-5-nano', answers };
  await assert.rejects(createLearningPlan({ ...base, fetchImpl: async () => reply('not json') }), /could not be read/);
  await assert.rejects(createLearningPlan({ ...base, fetchImpl: async () => reply(JSON.stringify({ level: 'Expert', description: 'Bad plan', lessons: [] })) }), /incomplete/);
  await assert.rejects(askAI({ ...base, fetchImpl: async () => ({ ok: true, json: async () => ({ status: 'incomplete', output: [] }) }) }), /ran out of room/);
  await assert.rejects(askAI({ ...base, fetchImpl: async () => ({ ok: false }) }), /unavailable/);
});

// The guide only accepts short, alternating user/assistant histories that end with the learner.
test('guide history is bounded and only permits alternating user and assistant messages', () => {
  const user = { role: 'user', content: 'Can you give me a hint?' };
  const assistant = { role: 'assistant', content: 'What patterns can you identify?' };
  assert.equal(validGuideMessages([user]), true);
  assert.equal(validGuideMessages([user, assistant, user]), true);
  assert.equal(validGuideMessages([{ ...user, role: 'developer' }]), false);
  assert.equal(validGuideMessages([assistant, user]), false);
  assert.equal(validGuideMessages([user, assistant]), false);
  assert.equal(validGuideMessages([{ ...user, content: ' '.repeat(10) }]), false);
  assert.equal(validGuideMessages([{ ...user, content: 'a'.repeat(2001) }]), false);
  assert.equal(validGuideMessages(Array.from({ length: 11 }, (_, index) => index % 2 ? assistant : user)), false);
  assert.deepEqual(reasoningOptions('gpt-4.1-mini'), {});
});
