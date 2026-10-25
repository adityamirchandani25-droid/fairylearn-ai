// Shared by the browser and server so lesson requests can only use approved topics.
export const pathLessons = {
  Starter: [
    { title: 'Hello, artificial intelligence', source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' },
    { title: 'AI in your everyday world', source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml' },
    { title: 'Your first conversation with AI', source: 'https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt' }
  ],
  Beginner: [
    { title: 'A closer look at generative AI', source: 'https://developers.google.com/machine-learning/crash-course/llm' },
    { title: 'The art of a good prompt', source: 'https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt' },
    { title: 'Using AI thoughtfully', source: 'https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research?hub=67076' }
  ],
  Medium: [
    { title: 'From simple prompts to workflows', source: 'https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt' },
    { title: 'Understanding how models learn', source: 'https://developers.google.com/machine-learning/crash-course/' },
    { title: 'Checking facts, bias, and limitations', source: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence' }
  ],
  Expert: [
    { title: 'Inside modern language models', source: 'https://developers.google.com/machine-learning/crash-course/llm' },
    { title: 'Building with models and APIs', source: 'https://developers.openai.com/api/docs/guides/text' },
    { title: 'Evaluating responsible AI systems', source: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence' }
  ]
};

export function findPathLesson(level, index) {
  return Number.isInteger(index) && index >= 0 && index < 3 ? pathLessons[level]?.[index] : undefined;
}
