// The three public modules map to the 2027–2028 TSA Webmaster challenge.
// Wording is original; source material is credited on the References page.
//
// The three free lessons anyone can take without an account. Each module has:
//   id       — a stable name used for progress, best scores and trophies (do not rename);
//   number   — the "LESSON 01" label;
//   icon     — the symbol on its card;
//   category — the small heading above the title;
//   title, summary, time — what the course page shows on the card;
//   badge    — the badge earned by passing the lesson's quiz;
//   sections — the three explanations shown in the lesson;
//   task     — the hands-on "Your turn" activity;
//   quiz     — the questions (see public/quiz.mjs for the question format);
//   source   — the main reference linked at the bottom of the lesson.
// In each quiz question, `answer` is the position of the correct choice in the list as written
// here (0 = first). The quiz shuffles the choices on screen, so the correct one moves around.
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
    quiz: [
      { question: 'Which description best fits machine learning?', choices: ['A model learns patterns from examples to make predictions or generate content.', 'A computer copies every answer from one web page.', 'A programmer writes a rule for every possible situation.', 'A model understands every topic exactly as a person does.'], answer: 0,
        hint: 'Think about the word “learning.” Where do the patterns come from?', explanation: 'Machine learning models learn patterns from examples instead of following only hand-written rules. Their outputs still need checking.' },
      { question: 'A model was trained only on plant photos taken in bright sunlight. What problem is most likely?', choices: ['It may struggle with photos taken in shade or at night.', 'It will work equally well on every plant photo.', 'It will refuse to make any prediction.', 'It will start recognizing animals instead.'], answer: 0,
        hint: 'The lesson says the quality and variety of examples matter. What is missing from these examples?', explanation: 'A model learns from the examples it sees. When the training data lacks variety, predictions on unfamiliar situations are less reliable.' },
      { question: 'What does generative AI do?', choices: ['Uses learned patterns to create new text, images, or audio.', 'Only sorts files into folders.', 'Searches the internet and copies the first result.', 'Stores a perfect copy of every fact it has seen.'], answer: 0,
        hint: 'The name is a clue: to generate means to create.', explanation: 'Generative AI creates new content, such as text or images, from patterns it learned during training.' },
      { question: 'An AI chatbot gives a fluent, confident answer about a recent event. What should you assume?', choices: ['It could still be wrong, so check a reliable source.', 'It must be true because it sounds confident.', 'It always has up-to-date information.', 'Fluent answers are never wrong.'], answer: 0,
        hint: 'Remember the useful limit from section 03: is sounding sure the same as being right?', explanation: 'Fluent text is not proof of truth. Models can produce convincing errors, especially about recent events outside their training.' }
    ],
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
    quiz: [
      { question: 'Which prompt is most useful for studying?', choices: ['Help me.', 'Write my whole homework and hide that I used AI.', 'I am in grade 10 chemistry. Quiz me on atoms with three questions and explain my mistakes.', 'Tell me everything about science.'], answer: 2,
        hint: 'A strong prompt includes context, a clear task, and a format.', explanation: 'The useful prompt gives context, a clear task, and a format, and it keeps you involved in the learning.' },
      { question: 'Which three parts make up the simple prompt recipe?', choices: ['The task, helpful context, and the format you want', 'Your name, password, and school', 'A greeting, a joke, and a thank-you', 'As many keywords as you can fit'], answer: 0,
        hint: 'Look back at section 02, “A simple prompt recipe.”', explanation: 'Giving the task, useful context, and the format you want makes a helpful response much more likely.' },
      { question: 'The AI’s answer is too vague. What is a good next step?', choices: ['Ask a follow-up for a concrete example.', 'Give up on the tool for good.', 'Copy the vague answer into your assignment.', 'Repeat the same prompt in capital letters.'], answer: 0,
        hint: 'Review, then revise. How could a second prompt help?', explanation: 'Revising your prompt, for example by asking for a concrete example, often improves the result.' },
      { question: 'You want to use a fact from an AI tool in a report. What should you do first?', choices: ['Verify the fact with a reliable source.', 'Trust it because your prompt was well written.', 'Ask the AI whether it is sure, then use it.', 'Change a few words so it looks different.'], answer: 0,
        hint: 'A better prompt can improve a result, but can it guarantee accuracy?', explanation: 'Even a great prompt cannot guarantee accuracy. Check factual claims with a trustworthy source before using them.' }
    ],
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
    quiz: [
      { question: 'What is the best next step when an AI answer gives an uncited statistic?', choices: ['Share it because it sounds precise.', 'Find the original reliable source and check the number.', 'Ask the same AI to say it more confidently.', 'Round the number so it seems safer.'], answer: 1,
        hint: 'Section 02 is about checking and crediting claims.', explanation: 'Check the claim against a reliable source before repeating it. AI tools can invent numbers and citations.' },
      { question: 'Which of these is safe to paste into an AI tool while you practice?', choices: ['A made-up example with no real names', 'A classmate’s phone number and address', 'Your school account password', 'A friend’s private message'], answer: 0,
        hint: 'Section 01 suggests using made-up examples or removing identifying details.', explanation: 'Made-up examples protect privacy. Never share passwords or other people’s private details with an AI tool.' },
      { question: 'An AI tool gives a one-sided answer about a group of people. What is the best response?', choices: ['Look for missing perspectives and check several credible sources.', 'Accept it, because AI is always neutral.', 'Share it widely so others can decide.', 'Ask the AI to make the answer more extreme.'], answer: 0,
        hint: 'Training data can underrepresent some people or viewpoints.', explanation: 'AI can reflect bias in its training data. Seek out missing perspectives and use more than one credible source.' },
      { question: 'Your teacher requires you to disclose AI help on a project. What should you do?', choices: ['Explain honestly how you used AI and credit your sources.', 'Hide your AI use if the work looks original.', 'Say an AI wrote everything, even the parts you wrote.', 'Leave out your sources to keep it short.'], answer: 0,
        hint: 'Section 02 covers being honest and giving credit.', explanation: 'Being open about AI help and crediting the sources you used follows school rules and keeps your work honest.' }
    ],
    source: 'https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research?hub=67076'
  }
];

// One extra question per module, in the same order as the modules (foundations, tools, ethics).
// The line below adds each to the end of its module's quiz when this file loads, so every
// public quiz has five questions.
const extraQuestions = [
  { question: 'A model is tested on examples it already saw during training. What would make the test more useful?', choices: ['Try new examples the model has not seen.', 'Repeat the same examples again.', 'Only test examples it got right.', 'Stop checking predictions.'], answer: 0, hint: 'A useful test checks more than memorization.', explanation: 'Unseen examples help show whether learned patterns work in new situations.' },
  { question: 'You want three short project ideas, but an AI gives a long essay. What should you clarify?', choices: ['The requested number and output format.', 'Your private account password.', 'That every response must be true.', 'Nothing; always accept the first response.'], answer: 0, hint: 'Think about the shape of the answer you need.', explanation: 'Specify three ideas and the desired length so the response fits your task.' },
  { question: 'A classmate shares private information in a practice prompt. What is the best response?', choices: ['Replace identifying details with a made-up example.', 'Add more personal details.', 'Share the prompt publicly.', 'Assume every AI service keeps it private.'], answer: 0, hint: 'Practice can use fictional information.', explanation: 'Made-up examples let you practice without exposing another person’s private information.' }
];
courseModules.forEach((module, index) => module.quiz.push(extraQuestions[index]));

// courseIds: the ids of the public modules.
// completedCourseIds: cleans a progress list read from browser storage. It keeps only real
// module ids and removes duplicates, so edited or outdated data cannot break the course page.
export const courseIds = courseModules.map(module => module.id);
export function completedCourseIds(value) {
  return Array.isArray(value) ? [...new Set(value.filter(id => courseIds.includes(id)))] : [];
}
