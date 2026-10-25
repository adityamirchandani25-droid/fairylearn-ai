// The three public modules map to the 2027–2028 TSA Webmaster challenge.
// Wording is original; source material is credited on the References page.
export const courseModules = [
  {
    id: 'foundations', number: '01', icon: '✧', category: 'AI FUNDAMENTALS', title: 'How does AI learn?',
    summary: 'Meet models, training data, and the difference between learning patterns and knowing facts.',
    time: '5 min', badge: 'Pattern Finder',
    sections: [
      { title: 'AI, machine learning, and generative AI', text: 'Artificial intelligence is a broad name for computer systems that perform tasks we associate with intelligence. Machine learning is one way to build them: a model learns patterns from examples instead of following only hand-written rules. Generative AI uses learned patterns to create text, images, audio, or other content.' },
      { title: 'What happens during training?', text: 'Imagine showing a model many labeled photos of plants. It adjusts its internal settings when a prediction is wrong, then tries again. When it sees a new photo, it uses learned patterns to make a prediction. The quality and variety of the examples matter.' },
      { title: 'A useful limit to remember', text: 'A fluent answer is not proof that it is true. A model can produce a convincing error, especially when the question needs recent facts or information outside its training. Treat an AI answer as a starting point for checking.' }
    ],
    task: 'Try it: Think of a school task where recognizing a pattern could help. What examples would the model need, and whose examples might be missing?',
    question: 'Which description best fits machine learning?',
    choices: ['A model learns patterns from examples to make predictions or generate content.', 'A computer copies every answer from one web page.', 'A model understands every topic exactly as a person does.'], answer: 0,
    feedback: 'Exactly. A model learns patterns from data, but its outputs still need checking.',
    source: 'https://developers.google.com/machine-learning/intro-to-ml/what-is-ml'
  },
  {
    id: 'tools', number: '02', icon: '⌁', category: 'PRACTICAL AI TOOLS', title: 'Ask better questions',
    summary: 'Use a clear prompt, inspect the result, and revise until the tool actually helps.',
    time: '6 min', badge: 'Prompt Crafter',
    sections: [
      { title: 'Start with a real goal', text: 'AI tools can help brainstorm, explain an idea, make a practice quiz, or organize notes. Choose the tool for the job. For a factual claim, use a source you can verify; for practice, ask the model to explain its reasoning and give examples.' },
      { title: 'A simple prompt recipe', text: 'Give the task, helpful context, and the format you want. For example: “I am studying photosynthesis in ninth-grade biology. Ask me three short questions, wait for my answers, and explain mistakes without giving the answer first.”' },
      { title: 'Review, then revise', text: 'Check whether the response followed your request. If it is too vague, ask for a concrete example. If it states a fact, verify that fact with a reliable source. A second prompt can improve the result, but it cannot guarantee accuracy.' }
    ],
    task: 'Try it: Rewrite “help with science” into a prompt with your topic, grade level, a specific task, and the format you want.',
    question: 'Which prompt is most useful for studying?',
    choices: ['Help me.', 'Write my whole homework and hide that I used AI.', 'I am in grade 10 chemistry. Quiz me on atoms with three questions and explain my mistakes.'], answer: 2,
    feedback: 'Right. The useful prompt gives context, a clear task, and a format while keeping you involved.',
    source: 'https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt'
  },
  {
    id: 'ethics', number: '03', icon: '♧', category: 'ETHICAL AI USE', title: 'Use AI with care',
    summary: 'Protect privacy, check claims, notice bias, and follow your school’s rules.',
    time: '6 min', badge: 'Thoughtful Explorer',
    sections: [
      { title: 'Keep people’s information private', text: 'Do not paste a classmate’s private details, passwords, or unpublished schoolwork into an AI tool. Use made-up examples or remove identifying details when you practice.' },
      { title: 'Check and credit', text: 'AI can invent citations and repeat errors. Follow a claim back to a trustworthy source before using it in an assignment. Be honest about AI assistance when your teacher or school requires disclosure, and credit sources you actually used.' },
      { title: 'Ask who might be left out', text: 'Training data can underrepresent people or viewpoints. If a tool gives a stereotyped or one-sided answer, look for missing perspectives and use more than one credible source. Your judgment stays part of the work.' }
    ],
    task: 'Try it: An AI tool gives you a surprising statistic with no source. Write down two steps you would take before sharing it.',
    question: 'What is the best next step when an AI answer gives an uncited statistic?',
    choices: ['Share it because it sounds precise.', 'Find the original reliable source and check the number.', 'Ask the same AI to say it more confidently.'], answer: 1,
    feedback: 'Yes. Check the claim against a reliable source before repeating it.',
    source: 'https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research?hub=67076'
  }
];

export const courseIds = courseModules.map(module => module.id);
export function completedCourseIds(value) {
  return Array.isArray(value) ? [...new Set(value.filter(id => courseIds.includes(id)))] : [];
}
