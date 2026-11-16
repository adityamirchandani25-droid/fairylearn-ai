// references.mjs — /references (also served as /references.html, the address the app and
// older links use). Lists the sources behind the lessons and credits the tools, fonts, images
// and AI assistance used to build the site. Keep it in step with the lessons and the build.
import { legalPage } from './legal.mjs';

const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}<span class="ref-arrow" aria-hidden="true">&nbsp;↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
const source = (href, label, note) => `<li class="ref-item">${ext(href, label)}<p>${note}</p></li>`;
const p = text => `<p>${text}</p>`;
const ul = items => `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;

export default () => legalPage({
  path: '/references', file: 'references.html', tagLabel: 'Sources & credits', bodyClass: 'page-legal page-references',
  title: 'What shaped Fairylearn.',
  lead: 'The sources behind every lesson, and the tools, fonts, images and AI help used to build the site.',
  description: 'Sources, credits and AI use for Fairylearn AI: the references behind each lesson and the tools used to build the site.',
  updated: 'Last updated October 29, 2026',
  note: 'Lesson explanations and examples were written for this project. They are not copied from the linked works.',
  sections: [
    { title: 'Learning content', body: p('These sources support the learning modules. Each note says how it was used.') + `<ol class="ref-list">${[
      source('https://developers.google.com/machine-learning/intro-to-ml/what-is-ml', 'Google for Developers, “What is Machine Learning?”', 'Used for the basic explanation of models, training examples, prediction and generation in Lesson 1.'),
      source('https://developers.google.com/machine-learning/crash-course/llm', 'Google for Developers, “Introduction to Large Language Models”', 'Further reading for the generative AI and language model learning paths.'),
      source('https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt', 'OpenAI Help Center, “Prompt engineering best practices for ChatGPT”', 'Used for the clear task, context and revision technique in Lesson 2.'),
      source('https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research?hub=67076', 'UNESCO, “Guidance for generative AI in education and research”', 'Used for the education, privacy and human judgment considerations in Lesson 3.'),
      source('https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence', 'NIST, “AI Risk Management Framework: Generative AI Profile”', 'Used for Lesson 3’s emphasis on trustworthy information, bias and verifying AI outputs.'),
      source('https://developers.openai.com/api/docs/guides/text', 'OpenAI, “Text generation”', 'Further reading for the advanced building-with-models learning path.'),
      source('https://tsaweb.org/competitions/themes-and-problems?hspage=4&amp;mspage=3', 'Technology Student Association, “Themes and Problems: Webmaster”', 'Used to match the 2027–2028 high school Webmaster challenge: AI fundamentals, practical tools, ethical use and progress tracking.')
    ].join('')}</ol>` },
    { title: 'Tools and services', body: ul([
      '<strong>Frameworks:</strong> no website builder, CMS, React, Vue or other front-end framework. The site is original HTML, CSS and JavaScript with a small Node.js server.',
      `<strong>Accounts:</strong> ${ext('https://supabase.com/docs/guides/auth', 'Supabase Auth documentation')} guided account access.`,
      `<strong>Personal lessons:</strong> ${ext('https://developers.openai.com/api/docs/guides/structured-outputs', 'OpenAI Structured Outputs documentation')} guided the server-side personal lessons.`
    ]) },
    { title: 'Fonts', body: ul([
      `${ext('https://rsms.me/inter/', 'Inter')} by Rasmus Andersson, used for all text. SIL Open Font License.`,
      `${ext('https://github.com/weiweihuanghuang/fragment-mono', 'Fragment Mono')} by Wei Huang, used for small labels. SIL Open Font License.`
    ]) + p('Both are served from this site, so no font requests go to other companies.') },
    { title: 'Images and icons', body: ul([
      '<strong>Logo:</strong> supplied by the project team.',
      '<strong>Watercolor illustrations:</strong> generated for this project with Google’s Gemini image model (Nano Banana Pro), all from one fixed style prompt kept in the project’s image script.',
      '<strong>Icons and interface graphics:</strong> drawn in SVG and CSS for this project.'
    ]) },
    { title: 'Generative AI disclosure', body: p('OpenAI Codex assisted with planning, writing and revising code and learning text for this site. Anthropic’s Claude assisted with the site redesign, including the code and wording of these pages and the image prompts.') + p('When a signed-in learner asks for a personal lesson, GPT writes it from their learning profile, and the site labels that lesson as made with AI.') + p('The team must review the final work, verify factual claims and rights to assets, and describe its actual AI use in the official Resources and AI Reflection form.') }
  ]
});
