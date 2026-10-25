export const questions = [
  { id: 'experience', title: 'How well do you know AI?', subtitle: 'There’s no wrong place to start. We’ll meet you where you are.', options: [ ['new', 'A fresh start', 'I’ve heard about AI, but haven’t really tried it.', '01'], ['curious', 'A little curious', 'I’ve tried ChatGPT or another AI tool a few times.', '02'], ['regular', 'Getting comfortable', 'I use AI regularly and know the basics.', '03'], ['advanced', 'Ready to go deeper', 'I build with AI or understand how models work.', '04'] ] },
  { id: 'knowledge', title: 'A little knowledge check', subtitle: 'What does a generative AI model do? It’s okay if you’re unsure.', options: [ ['search', 'Searches the internet', 'It only looks up and copies existing web pages.', 'A'], ['generate', 'Creates from learned patterns', 'It generates new content based on patterns in training data.', 'B'], ['think', 'Thinks exactly like a human', 'It has its own feelings and understands everything.', 'C'], ['unsure', 'I’m not sure yet', 'That’s one of the things I’d like to learn.', '?'] ] },
  { id: 'goal', title: 'What brings you here?', subtitle: 'Pick the goal that feels most like you. You can always explore more later.', options: [ ['everyday', 'Make everyday life easier', 'Use AI for planning, studying, and getting things done.', '✦'], ['creative', 'Bring my ideas to life', 'Explore writing, images, and creative possibilities.', '✎'], ['career', 'Build skills for my future', 'Understand AI and use it confidently at school or work.', '↗'], ['build', 'Build something with AI', 'Explore models, code, and how AI applications work.', '⌘'] ] },
  { id: 'format', title: 'How do you like to learn?', subtitle: 'Let’s make the journey feel natural to you.', options: [ ['visual', 'Show me the big picture', 'Visual slides, clear diagrams, and short explanations.', '▧'], ['practical', 'Let me try it out', 'Real examples and small hands-on challenges.', '◇'], ['guided', 'Walk me through it', 'Step-by-step lessons with room to ask questions.', '☷'], ['mixed', 'A little bit of everything', 'A mix of visuals, examples, and practice.', '✧'] ] },
  { id: 'pace', title: 'Make a little room for wonder.', subtitle: 'How much time would you like to spend learning each day?', options: [ ['5', '5 minutes', 'A small spark of learning in a busy day.', '☀'], ['10', '10 minutes', 'A little momentum, one day at a time.', '◷'], ['20', '20 minutes', 'Room to explore and put ideas into practice.', '◴'], ['30', '30 minutes or more', 'I’m ready to dive in and see where it takes me.', '✺'] ] }
];
export const levels = ['Starter', 'Beginner', 'Medium', 'Expert'];
export function getLevel(answers) {
  const experience = { new: 0, curious: 1, regular: 2, advanced: 3 }[answers.experience] ?? 0;
  return levels[Math.max(0, experience - (answers.knowledge === 'generate' ? 0 : 1))];
}
export function validAnswers(answers) {
  return !!answers && questions.every(q => q.options.some(o => o[0] === answers[q.id]));
}
export function planDescription(answers) {
  const goals = { everyday: 'make everyday tasks a little easier', creative: 'bring your creative ideas to life', career: 'build confidence for school and work', build: 'start building with AI' };
  return `Your ${getLevel(answers).toLowerCase()} journey is designed to help you ${goals[answers.goal] || 'explore AI'}. With ${answers.pace || 10} minutes a day, you’ll build understanding one small discovery at a time.`;
}
