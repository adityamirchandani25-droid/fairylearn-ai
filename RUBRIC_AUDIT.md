# Fairylearn AI — 2027–2028 Webmaster rubric audit

This checklist compares the site with the rubric screenshots supplied by the team and the [official Webmaster theme and challenge](https://tsaweb.org/competitions/themes-and-problems?hspage=4&mspage=3). It records current evidence and the items that still require team action. It is not a substitute for the official TSA forms or a judge's evaluation.

| Requirement | Status | Evidence or next action |
| --- | --- | --- |
| AI learning portal for grades 9–12 | Implemented | The public course hub and lesson language directly address high school students. Signed-in learners can generate level-specific lessons from their saved answers. |
| Fundamentals of AI | Implemented | “How does AI learn?” explains AI, machine learning, training data, generative AI, and limitations. |
| Practical AI tools and techniques | Implemented | “Ask better questions” teaches prompting, revision, and verification, with a local prompt builder. |
| Ethical AI use in school | Implemented | “Use AI with care” covers privacy, fact checking, bias, credit, and school rules. |
| Interactive gamification and visual progress | Implemented | Each lesson has a knowledge check; correct answers unlock three badges. The course hub shows completion and a progress bar. Progress persists in browser storage. |
| Public access without credentials | Implemented locally | Home, lessons, and sources open without an account. Verify the same on the final public URL. |
| Annual theme reflected throughout | Implemented | Landing page, course, assessment, path previews, and source page all support an AI learning portal. |
| Credible reference page with at least four applicable sources | Implemented | `/references.html` lists five content/challenge sources plus technology, font, and asset credits. |
| Document used frameworks | Implemented | Reference page states the site uses plain HTML, CSS, JavaScript, and Node.js; no website builder or CMS is used. |
| AI use and ethical reflection | Partly complete | The site discloses Codex assistance. The team must complete the official Resources and AI Reflection form accurately, export it as a PDF of at most four pages, and place it on the reference page. |
| Student Copyright Checklist | Pending team document | The team must complete the official checklist, export it as a one-page PDF, and place it on the reference page. Verify rights to the supplied logo and any other external assets. |
| Website URL accessible and functional online | Pending deployment | The repository is source code, not a hosted site. Deploy the Node app, configure public host variables, test the actual URL without login, and submit that URL. |
| Accessible 24/7 through the competition period | Pending deployment/hosting | Choose a host and plan that stays online; monitor uptime. Localhost and sleeping free tiers cannot establish this. |
| Current school year authorship | Team verification | Confirm all website pages and assets were developed during the current school year. Git history alone does not prove this for supplied assets. |
| No broken links/images; major browsers and mobile | Partly tested | Local Chrome desktop and a 390px viewport were checked. Test the deployed URL in current Edge, Firefox, and Chrome on desktop and mobile before submission. |
| Semifinal interview | Team preparation | Team members need to explain the design, code, research, testing, AI assistance, and their own contributions within the interview time limit. |

## Before submission

1. Review the full official event guide, current competition updates, and state-level variations.
2. Have the team verify the lesson wording and source claims, and complete the two official participant PDFs. Add links to the completed PDFs on `/references.html`.
3. Deploy the app with `HOST=0.0.0.0`, the host-assigned `PORT`, and the necessary environment variables. Set the Supabase Auth Site URL to the public origin if account features are used.
4. Open the public home URL in a private browser window; complete all three lessons; check the badges and source links; test sign-up only if configured.
5. Check mobile, Chrome, Edge, and Firefox; confirm the site remains reachable without login; submit the main page URL by the deadline.
