// path-lessons.mjs — the catalog of approved lesson topics and the rules for learning paths.
//
// pathLessons holds 40 topics: 10 for each of the four levels. Each has a title and a source
// link that is shown as further reading. A lesson's position in its level's list is its
// `index`, so { level: 'Beginner', index: 1 } means "The art of a good prompt". Because
// saved paths store these positions, add new topics at the END of a list; inserting or
// removing one in the middle would change which lesson existing paths point to.
//
// A learning plan (path) looks like:
//   { level: 'Beginner', ai: true, lessons: [ { level, index } ... , { id, level, title, objective } ... ] }
// Catalog stops are { level, index }. Stops invented later by the AI (when a learner asks for
// another chapter) are { id: 'ai:<uuid>', level, title, objective } instead.
//
// Shared by the browser and server so lesson requests can only use approved topics.
export const pathLessons = {
  Starter: [
    { title: 'Hello, artificial intelligence', source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' },
    { title: 'AI in your everyday world', source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' },
    { title: 'Your first conversation with AI', source: 'https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt' },
    { title: 'Spotting AI around you', source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' },
    { title: 'What AI can and cannot do', source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' },
    { title: 'Giving AI clear instructions', source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' },
    { title: 'Learning with an AI helper', source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' },
    { title: 'Keeping personal information private', source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' },
    { title: 'When an AI answer is wrong', source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' },
    { title: 'Your first everyday AI project', source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' }
  ],
  Beginner: [
    { title: 'A closer look at generative AI', source: 'https://developers.google.com/machine-learning/crash-course/llm' },
    { title: 'The art of a good prompt', source: 'https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt' },
    { title: 'Using AI thoughtfully', source: 'https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research?hub=67076' },
    { title: 'Adding context and examples', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Improving an answer step by step', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Brainstorming without losing your voice', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Study plans and practice questions', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Comparing AI tools', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Recognizing made-up information', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'A small creative AI project', source: 'https://developers.openai.com/api/docs/guides/text' }
  ],
  Medium: [
    { title: 'From simple prompts to workflows', source: 'https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt' },
    { title: 'Understanding how models learn', source: 'https://developers.google.com/machine-learning/crash-course/' },
    { title: 'Checking facts, bias, and limitations', source: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence' },
    { title: 'Breaking a task into smaller steps', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Designing reusable prompts', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Working with documents and data', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Understanding context windows', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Measuring the quality of an answer', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Human review in AI workflows', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Designing your own AI workflow', source: 'https://developers.openai.com/api/docs/guides/text' }
  ],
  Expert: [
    { title: 'Inside modern language models', source: 'https://developers.google.com/machine-learning/crash-course/llm' },
    { title: 'Building with models and APIs', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Evaluating responsible AI systems', source: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence' },
    { title: 'Retrieval and grounded answers', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Structured outputs and validation', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Building a helpful AI assistant', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Testing models with an evaluation set', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Prompt injection and trust boundaries', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Balancing quality, cost, and latency', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Planning a responsible AI product', source: 'https://developers.openai.com/api/docs/guides/text' }
  ]
};

// Looks up a catalog topic. Returns undefined for anything that is not a real level and a real
// position. Object.hasOwn() is used instead of `level in pathLessons`, so tricky names such as
// "__proto__" or "toString" can never match.
export function findPathLesson(level, index) {
  return Object.hasOwn(pathLessons, level) && Number.isInteger(index) && index >= 0 && index < (pathLessons[level]?.length || 0) ? pathLessons[level]?.[index] : undefined;
}

// The standard path, used for preview mode and whenever AI placement is unavailable: all ten
// topics of the learner's starting level, in order. The level is chosen with the same rule as
// getLevel() in learning.mjs. ai: false makes the page label it as the standard path.
export function fallbackLearningPlan(answers) {
  const experience = { new: 0, curious: 1, regular: 2, advanced: 3 }[answers.experience] || 0;
  const levels = Object.keys(pathLessons);
  const level = levels[Math.max(0, experience - (answers.knowledge === 'generate' ? 0 : 1))];
  return { level, lessons: pathLessons[level].map((_, index) => ({ level, index })), ai: false };
}

// True for a well-formed AI-invented stop: an id of the form "ai:<36-character uuid>", a real
// level, a title of 5–120 characters and an objective of 15–500 characters.
export function isGeneratedLesson(item) {
  return !!item && typeof item.id === 'string' && /^ai:[a-f0-9-]{36}$/.test(item.id) &&
    Object.hasOwn(pathLessons, item.level) && typeof item.title === 'string' && item.title.trim().length >= 5 && item.title.length <= 120 &&
    typeof item.objective === 'string' && item.objective.trim().length >= 15 && item.objective.length <= 500;
}
// lessonKey: one unique string per stop, used to remember progress — the id for AI stops, or
// "Level:index" for catalog stops (e.g. "Beginner:1").
// resolvePlanLesson: finds the topic for a stop the browser asks about. AI stops must exist in
// this learner's own saved plan; catalog stops must exist in the catalog. Anything else returns
// undefined, which the server answers with "Choose a lesson from your learning path".
export function lessonKey(item) { return item.id || `${item.level}:${item.index}`; }
export function resolvePlanLesson(plan, reference) {
  if (reference?.id) return plan?.lessons?.find(item => item.id === reference.id && isGeneratedLesson(item));
  return findPathLesson(reference?.level, reference?.index);
}
// Checks a whole plan before it is used or saved: a real level, at least 8 stops, every stop
// valid (catalog or AI-made), and no stop listed twice.
export function validLearningPlan(plan) {
  return !!plan && Object.hasOwn(pathLessons, plan.level) && Array.isArray(plan.lessons) && plan.lessons.length >= 8 &&
    plan.lessons.every(item => item?.id ? isGeneratedLesson(item) : !!findPathLesson(item?.level, item?.index)) &&
    new Set(plan.lessons.map(lessonKey)).size === plan.lessons.length;
}
