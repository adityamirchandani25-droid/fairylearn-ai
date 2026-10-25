# Fairylearn AI

A responsive AI learning portal for grades 9–12: landing page, three public learning modules, Khan Academy–style quizzes with badges, a unit test, and progress tracking, Supabase signup/login, a five-question assessment, a winding lesson map, AI-selected placement and lesson sequences, and a working AI guide. The starter catalog includes 40 topics across Starter, Beginner, Medium, and Expert levels; AI creates additional chapters beyond that catalog.

## Run locally

Requires Node.js 22 or newer. No dependencies to install.

```sh
cp .env.example .env
npm run dev
```

Open http://localhost:3000. `npm run dev` restarts the server automatically when you edit a file; with `npm start`, restart it yourself after changes, or new API routes will answer "Not found" or "Method not allowed". Without keys, **Explore without an account** runs the full questionnaire and saves a preview in local browser storage. Account creation is disabled until Supabase is configured.

## Connect Supabase

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor. Row-level security restricts each profile to its owner.
2. Add your project URL and public anon/publishable key to `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`. Never use a service-role key here; these two values are exposed to the browser.
3. Enable email/password authentication. In Auth URL Configuration, set Site URL to `http://localhost:3000` for local development, then update it to your actual origin when deploying. Email confirmation links return to this origin. The app handles confirmation and session refresh.
4. Restart the server. Create an account, confirm your email if required, log in, and finish the questionnaire. Answers and the path introduction are saved to `learning_profiles`.

Sign-up and login go from the browser straight to Supabase Auth, so Supabase's own per-IP limits protect those endpoints. `public/auth.mjs` owns the session: it keeps it in localStorage (so it survives reloads and new tabs), refreshes the token shortly before it expires with only one refresh in flight at a time, and picks up refreshes or logouts made in other tabs. Every call to this site's API sends the current token and retries once with a fresh token if the server answers 401. Only a rejected refresh token signs the learner out; network problems show a message and keep the session. Supabase error codes are shown as plain-language messages. All profile reads and writes go through the server (`GET /api/profile`, `POST /api/personalize`), which verifies the token with Supabase first. Preview answers are stored in localStorage. Logout clears all local account state. The five-question assessment supplies experience, a knowledge check, goals, learning style, and pace. AI chooses an initial skill level and an ordered sequence of 10–14 approved topics. Existing accounts receive a path on their next login. Learners can update their answers to rebuild their path.

## OpenAI personalization and lessons

Add `OPENAI_API_KEY` to `.env.local` (or `.env`) and optionally set `OPENAI_MODEL` (default `gpt-4.1-mini`; `gpt-5-nano` is supported). `npm run dev` and `npm start` load both files, with `.env.local` taking precedence. The key stays on the Node server.

On questionnaire completion, `/api/personalize` verifies the Supabase user and validates the answers. GPT selects the skill level and an ordered sequence from the 40-topic catalog. The validated plan is stored as `answers.learning_plan` in the existing profile JSON. The server saves it alongside the questionnaire answers, with the assigned level in `level` and its explanation in `description`. No schema migration is needed. If AI is unavailable, the app labels and supplies a standard ten-lesson path based on the knowledge check and experience. Preview mode also uses this standard path. AI placement is limited to ten requests per learner per hour; past that, learners still get the standard path instead of an error.

**My path** shows a winding trail of circular lesson stops. The next stop is highlighted, later stops unlock after passing the lesson quiz, and completed lessons remain available for review. `/api/lesson` verifies the session, reads the saved profile, and generates three explanations, a practice task, and a five-question quiz on a starter or saved AI-generated topic. Each question has four choices, a hint, and an explanation. A malformed question is dropped rather than failing the lesson, as long as five valid questions remain. Learner progress is saved in that learner's browser storage; generated lesson content is cached on the server for 24 hours or until restart. The endpoint permits up to 30 new generations per user per hour.

The floating **AI guide** works on the path and inside lessons. `/api/guide` checks authentication and the stored profile, accepts a bounded conversation, and supplies the current approved lesson title as context. The guide adapts explanations to the learner and gives hints for quizzes. It permits up to 40 messages per learner per hour. Conversations stay in browser memory, are cleared on logout, and requests use `store: false`. All model text is escaped before rendering. The guide shows errors and retains a failed message for retry. Live AI calls require a configured API key and available account credit; automated tests use fake responses.

The Node server binds to loopback for local development. For a public host, set `HOST=0.0.0.0` and use the host-assigned `PORT`. Deployment needs the Node server as well as `public/`, since the server provides configuration and secure personalization. Submit the public site's home URL, not a GitHub repository URL; judges must be able to open the home page and lessons without logging in.

## Deploy to Vercel

Import the repository with the project root set to this directory. The checked-in
`vercel.json` selects the **Other** framework preset, skips the build command, and
serves `public/` directly. Remove conflicting dashboard build/output overrides.
`api/index.mjs` exports the existing request handler as a Vercel Node function;
all `/api/*` requests are rewritten to it, and `/logo.png` maps to the public logo.
The function has a 60-second duration to accommodate the AI request timeout.

In Vercel Project Settings → Environment Variables, add `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, optional `OPENAI_MODEL`, and `TRUST_PROXY=1`.
Local `.env` files are not deployment configuration. Redeploy after changing these
values. Set Supabase's Site URL and allowed auth redirect URLs to the deployed origin.
No `HOST` setting or `npm start` command is needed on Vercel.

After deployment, check `/`, `/logo.png`, and `/api/config`. If Vercel reports a
function failure, inspect that deployment's Runtime Logs for the exception.
Missing service keys should disable the corresponding features rather than crash
the homepage. In-memory lesson caches and rate limits apply per function instance
and reset on cold starts; they are not shared across Vercel instances.

## Quizzes

Every lesson ends with a Khan Academy–style quiz (`public/quiz.mjs`). Questions appear one at a time with shuffled choices. Learners choose an answer and press **Check**. A wrong answer is crossed out, and they try again or ask for a hint. A correct answer shows why it is right. Only answers that are right on the first try without a hint count toward the score. Passing needs 80% (4 of 5), and the results screen offers a retake. The course hub also has a ten-question **unit test** that samples all three public topics. Best scores are kept in browser storage.

## Rate limiting

`rate-limit.mjs` is a small in-memory fixed-window limiter. Every `/api/*` request counts against the caller's IP (120 per minute). AI work also counts against the learner's hourly allowance: 10 placements, 10 chapter extensions, 30 new lessons, and 40 guide messages. A limited request gets HTTP 429 with a `Retry-After` header and a message saying when to try again. Behind a reverse proxy, set `TRUST_PROXY=1` so the limit uses the client address from `X-Forwarded-For`. Limits reset when the server restarts and apply per process.

## Public lessons and competition references

The **Explore lessons** entry leads to three usable public modules: AI fundamentals, practical prompting, and ethical AI use. Each has original explanatory content, a practice task, and a five-question quiz. Passing the quiz earns a badge; the course hub shows completion and a progress bar. Progress is stored in this browser and can be used without an account. The prompt builder in the tools module runs locally and does not send its text to an AI service. The personal journey map provides additional GPT-generated lessons for signed-in learners.

The public `/references.html` page credits content sources, fonts, services, graphics, and AI assistance. It also documents the site's stack; there is no front-end framework or CMS. See `RUBRIC_AUDIT.md` for what is implemented and what still needs student-supplied documents or a live deployment.

## Validation

```sh
npm test
node --check server.mjs
node --check public/app.mjs
```

Google Fonts are optional; system and Georgia fallbacks keep the site usable offline.

## Brand and motion

The supplied `logo.png` is copied unchanged to `public/fairylearn-logo.png`. The server exposes it at `/logo.png`, and the header, footer, and real loading states reuse its fairy symbol with a CSS crop that preserves the source image. To replace the brand image, update `public/fairylearn-logo.png`. A star mark provides a fallback if the image is unavailable.

`public/motion.mjs` adds one-time scroll reveals, short page entrances, questionnaire fades, and lesson-tab entrances. Animations do not delay navigation. Loading indicators follow actual requests rather than an artificial timer. Reduced-motion preferences disable movement and leave all content visible; keyboard focus also reveals any focused section immediately.

The questionnaire uses one centered card with five answer dots. Its fairy guide moves to a new position between questions and opens a short explanation for the current question when clicked.

## Trophies and the item shop

Completing a lesson earns **1 trophy**. Quizzes earn **3 trophies at 80–94%** or **5 total at 95%+**. Improving a quiz from the lower tier adds only 2 trophies. Standalone quizzes do not also claim a lesson-completion trophy. Each lesson and quiz rewards once, with an absolute **400-trophy lifetime cap**. Spending does not reset or replenish that cap; learning continues after it is reached.

The shop has twelve working perks, with Quiz help, Study tools, and Style filters:

| Perk | Cost | Effect |
| --- | ---: | --- |
| Clarity Token | 3 | Remove one incorrect quiz option; one use per question. |
| Hint Pass | 5 | Protect the point when revealing a hint. |
| Retry Charm | 8 | Protect one wrong choice if the next choice is correct. |
| Focus Lens | 20 | Larger lesson text and wider line spacing. |
| Study Timer | 25 | A pauseable ten-minute focus timer during lessons and quizzes. |
| Golden Trail | 40 | A gold learning path and next-lesson marker. |
| Sage Garden | 60 | A sage palette for buttons, quiz panels, and highlights. |
| Ocean Explorer | 80 | An ocean-blue palette throughout the app. |
| Starlight Map | 100 | A starfield behind the lesson journey. |
| Mastery Journal | 125 | Recent quiz attempts, average scores, and learning milestones. |
| Aurora Trail | 150 | A teal-and-violet path and glowing next-lesson marker. |
| Scholar Crown | 200 | A crown on the brand and learning dashboard. |

The first three items are consumable; the rest are permanent and toggleable. Conflicting palettes and trail styles equip exclusively. Free hints remain available. Consuming or restarting a quiz never refunds a used perk. Trophies, owned items, and the journal save per account (or a separate guest) in this browser, not across devices. Existing purchased perks are grandfathered when migrating from the old reward economy, and old trophy claims are recalculated at the new rates.

## Continuing AI lessons

`POST /api/path/continue` uses the learner’s saved profile, previous topics, and completed lesson IDs to create six fresh topics with learning objectives. The server assigns stable UUIDs, validates the chapter, and appends it to `answers.learning_plan` using an atomic profile revision check. No database migration is required. Generated topics are not restricted to the starter catalog, and the journey can keep growing beyond 40 lessons.

New chapters are requested automatically after a personal lesson when two or fewer stops remain. **Generate my next 6 lessons** also allows learners to request a chapter manually. AI failure leaves the existing path and progress intact and allows a retry. Chapters require an authenticated learner, a configured OpenAI key, and available API credit, with ten chapter requests per hour. Individual generated lesson content and five-question quizzes are produced when a stop is opened; their topic and objective come from that learner’s saved path. Other learners’ generated IDs are rejected. Generated lesson metadata persists in Supabase, while completions remain in browser storage.

## Standalone quizzes

Open **Quizzes** in the main navigation, **Try a quick quiz** on the home page, or **Explore quizzes** from the course hub or personal path. The quiz library offers three five-question topic quizzes and a ten-question mixed challenge drawn from all three topics. They work without an account, include hints and answer explanations, and support purchased quiz perks. Topic quizzes pass at 4/5 points; the mixed challenge passes at 8/10.

The library shows quizzes passed, saved best scores, and remaining trophy rewards. Standalone quiz rewards are separate from reading and completing a lesson. Standalone and in-lesson quizzes share the same scores and trophy awards, so switching entry points never duplicates rewards. Completing a standalone quiz returns to the quiz library. Learners can review the associated lesson from either a quiz card or the quiz page.
