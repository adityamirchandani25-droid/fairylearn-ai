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
  quiz: [
    { question: 'What should you do after an AI tool gives you a surprising factual claim?', choices: ['Check the claim with a reliable source.', 'Accept it because it sounds confident.', 'Ask it to repeat the claim loudly.', 'Share it right away.'], answer: 0, hint: 'Is sounding confident the same as being right?', explanation: 'Checking a reliable source is the best way to test an AI-generated factual claim.' },
    { question: 'Which prompt gives an AI tool the most useful context?', choices: ['Help.', 'Write a poem.', 'Write a four-line poem about autumn for my grade 9 class.', 'Do something creative.'], answer: 2, hint: 'Look for a task, an audience, and a format.', explanation: 'It names the task, the audience, and the format.' },
    { question: 'What is a good way to improve a vague AI response?', choices: ['Ask a follow-up for a concrete example.', 'Give up.', 'Copy it anyway.', 'Type the prompt in capitals.'], answer: 0, hint: 'Review, then revise.', explanation: 'A focused follow-up prompt often improves the result.' },
    { question: 'Why should you follow your teacher’s rules about AI?', choices: ['They keep your work honest and fair.', 'AI is always banned.', 'Rules never apply to AI.', 'It makes the AI faster.'], answer: 0, hint: 'Think about honesty in schoolwork.', explanation: 'School rules help you use AI honestly and fairly.' }
  ]
};

lesson.quiz.push({ question: 'What information should you keep out of practice prompts?', choices: ['Private details about real people.', 'Fictional examples.', 'The task you want help with.', 'A requested format.'], answer: 0, hint: 'Practice can use made-up examples.', explanation: 'Avoid sharing private information when using AI tools.' });

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
  assert.equal(result.quiz.length, 5);
  assert.match(body.instructions, /exactly five multiple-choice questions/);
  assert.equal(body.text.format.schema.properties.quiz.items.required.includes('hint'), true);
  assert.equal(result.sections.length, 3);
});

test('malformed AI lessons cannot unlock an incorrect quiz', () => {
  assert.throws(() => validateGeneratedLesson({ ...lesson, sections: [] }), /incomplete lesson/);
  assert.throws(() => validateGeneratedLesson({ ...lesson, quiz: lesson.quiz.slice(0, 2) }), /incomplete lesson/);
  assert.throws(() => validateGeneratedLesson({ ...lesson, quiz: lesson.quiz.map(item => ({ ...item, answer: 7 })) }), /incomplete lesson/);
});

test('one malformed quiz question is dropped instead of failing the whole lesson', () => {
  const result = validateGeneratedLesson({ ...lesson, quiz: [...lesson.quiz, { ...lesson.quiz[0], choices: ['Same', 'Same', 'Same'] }] });
  assert.equal(result.quiz.length, 5);
  assert.equal(validateGeneratedLesson({ ...lesson, quiz: [...lesson.quiz, ...lesson.quiz] }).quiz.length, 5);
});

test('lesson requests can only select approved level topics', () => {
  assert.equal(findPathLesson('Starter', 0)?.title, 'Hello, artificial intelligence');
  assert.equal(findPathLesson('Expert', 2)?.title, 'Evaluating responsible AI systems');
  assert.equal(findPathLesson('Custom', 0), undefined);
  assert.equal(findPathLesson('Starter', 12), undefined);
  assert.equal(findPathLesson('Starter', '0'), undefined);
});
