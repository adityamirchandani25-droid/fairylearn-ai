# Fairylearn AI

A responsive AI learning onboarding app: landing page, Supabase signup/login, five-question learning assessment, and personalized Starter, Beginner, Medium, and Expert paths. Slideshows, lessons, and the AI tutor are clearly marked as coming soon.

## Run locally

Requires Node.js 22 or newer. No dependencies to install.

```sh
cp .env.example .env
npm run dev
```

Open http://localhost:3000. Without keys, **Explore without an account** runs the full questionnaire and saves a preview in local browser storage. Account creation is disabled until Supabase is configured.

## Connect Supabase

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor. Row-level security restricts each profile to its owner.
2. Add your project URL and public anon/publishable key to `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`. Never use a service-role key here; these two values are exposed to the browser.
3. Enable email/password authentication. In Auth URL Configuration, set Site URL to `http://localhost:3000` for local development, then update it to your actual origin when deploying. Email confirmation links return to this origin. The app handles confirmation and session refresh.
4. Restart the server. Create an account, confirm your email if required, log in, and finish the questionnaire. Answers and the path introduction are saved to `learning_profiles`.

Sessions are stored in sessionStorage; preview answers are stored in localStorage. The app clears local session state on logout. The assessment uses experience and a knowledge check to select an initial level; all four paths remain browsable.

## Optional OpenAI personalization

Add `OPENAI_API_KEY` to `.env` and optionally set `OPENAI_MODEL` (default `gpt-4.1-mini`). The key stays on the Node server. On completion, `/api/personalize` verifies the Supabase user, validates the answers, and asks OpenAI for a short introduction based on goal, learning style, level, and pace. A local introduction is used if the key is absent or OpenAI is unavailable. Preview mode uses the local introduction. No chat tutor or lesson generation is implemented yet.

The Node server binds to loopback for local development. Deployment needs the Node server as well as `public/`, since the server provides configuration and secure personalization.

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
