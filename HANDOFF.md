# Handoff: Duna-style redesign of Fairylearn AI

Paste everything in the "Prompt" section below into a new Claude Code session on this repository,
with branch `claude/duna-fairylearn-redesign-4oj514` checked out. It contains the original brief
plus the exact state of the work, so the new session finishes it instead of starting over.

---

## Prompt

You are taking over a design build that another Claude session started and could not finish
(it hit its usage limit). Read this whole message, then `git log --oneline` and `HANDOFF.md`
in the repo, and continue. Do not restart or redesign what is already done; finish, verify and polish.

### The original brief (from the owner, unchanged)

> this is a personal design experiment. i want to see how close you can get to a real site's design, so be precise and show me what you can do.
>
> what i want: rebuild the duna.com landing page to the highest accuracy you can. same design system, same layout, same type, spacing, radii and behavior. then build the rest of the pages in that same system. its for my product, fairylearn ai (fairylearn-ai.vercel.app), so the brand, copy and images are ours, and a few layouts are slightly different. should look very close to duna, just not a screenshot of it.
>
> links
> 1. https://styles.refero.design/style/8cf4a580-bfb6-4090-a899-f734ffe62370 — duna design system. inspect this FIRST and fully. open every tab on it (preview, DESIGN.md, tailwind v4, css variables, design tokens, compact + extended). it has everything you need to build properly. dont skim.
> 2. https://duna.com/ — the live site. open it in the browser, dont just fetch it. screenshot at 1440, 768 and 390, scroll the whole page. note every section, hover state, animation, and every page it links to (product pages, solutions, customers, company, resources, legal).
> 3. https://fairylearn-ai.vercel.app/ — our current site. look at it so you know the product and the copy tone before you replace it.
>
> heads up: refero's snapshot is slightly stale (its hero headline differs from the live site), and the live site has more going on than the doc says, like a blue sky image band with glass chips and small green mono labels on functional states. when they disagree, follow the live site.
>
> the system, nonnegotiable
> - canvas Linen #f7f7f5, white #ffffff cards, Bone #edece7 panels, Mist #eeeeee input fill. text Aubergine Ink #1b0624, buttons Espresso #160f0c, muted Warm Ash #766a7c, Graphite #444444, Stone #898683, Charcoal #292421.
> - one grotesk for everything. GT America is paid so use Inter or Geist, loaded properly so it never falls back. weights 400 and 500 only. display 72-80px, line-height 1, -0.06em tracking (-4.32px at 72). heading-lg 44px / -2.2px, heading 32px / -0.96px, subheading 24px / -0.48px, body-lg 20px, body 18 and 16, caption 14, micro 12.
> - radii: buttons and tags 999px, hero button 60px, cards 16px, images 24px, inputs 8px. no shadows except a 1px inset ring rgba(0,0,0,0.05). 1200px max width, 80-120px between sections, 24-32px card padding, 16px gaps.
> - one filled button color (Espresso). no blue/green accents in the ui. thin-stroke geometric line icons only.
>
> landing page structure, match duna.com: nav (logo left, centered links, dark pill CTA right) > hero (full-bleed painting fading into white, announcement pill, 72-80px headline, subtext, CTA) > grayscale logo bar > headline + 3 oversized stats + 3 icon rows split by hairlines > full-bleed sky band with glass chip > 3 to 4 product modules, each a Bone panel of stylized UI fragments linked by arrows, with 4 micro-features underneath > quote section > trust badge section > 3 story cards > footer with link columns and art > cookie panel bottom-right. recreate every animation and hover too.
>
> what changes (make 3 to 4 deliberate layout deviations and list them for me)
> - brand is fairylearn ai. warm, short, curious copy. modules become find your path / learn / practice. the product fragments are lesson paths, level cards, a quiz card and an ai guide bubble, built in html/svg, not generated.
> - logo bar becomes a strip of the four levels (starter, beginner, medium, expert). quote section becomes the 3-step how it works. trust badge section becomes free to start. story cards become sample lesson cards.
> - stats must be real or honest (3 free essentials, 4 levels, about 2 minutes to start). no fake customers, metrics or testimonials.
> - layouts: change the order of a couple sections and make a module or two different, as long as the system rules above stay intact.
> - images: all ours. new hero painting (dusk or dawn path through a misty lavender and sage landscape, not a sunset), new sky band, new footer art. none of duna's files, their asterisk logo, their copy, their customer names or logos.
>
> pages: after the landing is done, screenshot it and send it to me before anything else. then the rest in the same system: lessons, paths, quiz, pricing, login, signup, about, terms, privacy, plus a lesson detail page. list the page set before building and go, dont wait for me. if theres an existing fairylearn repo, link login and signup to its real routes and dont touch auth or app logic.
>
> images: i will paste a nano banana api key in this chat and delete it after the session. put it in .env.local, make sure .env* is gitignored, read it only through process.env, never hardcode, log or commit it. generate from a script. one locked style prompt (soft painterly watercolor, lavender / sage / cream), compose for the crop with a quiet centre and a pale bottom third on the hero, no text or logos in the images. produce the hero (16:9 plus a 4:5 mobile crop), sky band, footer art and a few lesson card illustrations. save as webp with alt text.
>
> how to work
> - you are the orchestrator. first set up the project (match the existing fairylearn stack if theres a repo, otherwise next.js + tailwind v4), fonts, tokens and shared components (nav, buttons, pills, cards, panels, inputs, footer, cookie panel). that foundation comes first.
> - then spawn subagents in parallel: one for images, one per landing section group, and one that only verifies. after the landing passes verification, spawn one subagent per remaining page. subagents dont edit the foundation without telling you.
> - verify against duna.com with screenshots at 1440/768/390, and check computed styles (bg, radii, no box-shadow beyond the inset ring, h1 size/weight/tracking).
> - frequent updates. one or two lines every few minutes, and a screenshot after every finished section or page.
>
> Later the owner added: "the full codebase should be updated with this design" (other screens, motion, etc.), meaning the existing learning app at /app should be restyled into the same system too.

### What is already done (on branch `claude/duna-fairylearn-redesign-4oj514`)

Stack decision: the repo is a no-build Node app (`server.mjs` + static `public/`, deployed on Vercel
with `outputDirectory: public`), so the marketing site matches it: a zero-dependency static build.

- **Build:** `site/build.mjs` (`npm run build:site`) joins `site/styles/*.css` → `public/assets/site.css`,
  `site/scripts/*.js` → `public/assets/site.js`, copies `site/scripts/modules/*.mjs` → `public/assets/js/`,
  renders every `site/pages/*.mjs` through `site/lib/layout.mjs` into `public/*.html`, and writes
  `public/site-files.json`, which `server.mjs` uses as its static whitelist. Generated files are committed.
  `vercel.json` has `cleanUrls: true`. Always rebuild after editing anything in `site/`.
- **Foundation (orchestrator-owned; subagents must not edit without saying so):**
  - `site/styles/00-tokens.css`: Refero tokens plus live-site measurements, and self-hosted Inter Var (wght + opsz) and Fragment Mono for the green mono labels.
  - `site/styles/01-base.css`: type roles (`.t-display`, `.t-heading-lg`, …) and the `[data-reveal]` fade-up.
  - `site/styles/02-components.css`: buttons, pills, tags, the glass chip, cards, panels, inputs, the feature accordion, and the nav (fixed, 8-layer progressive blur, glass dropdowns, burger menu). Also the footer with art and scrim, and the storage notice.
  - `site/lib/` holds `icons.mjs` (own thin-stroke icon set and brand mark), `components.mjs` (HTML helpers) and `site.mjs` (nav, footer links, image registry with alt text, lesson slugs).
  - `site/scripts/00-core.js` (nav, dropdowns, mobile menu, reveal, count-up, notice) and `20-features.js` (accordion hover, click, auto-advance and panel sync).
- **Landing `/`** (sections in `site/sections/`, styles `10–17`):
  - hero
  - level marquee
  - stats and icon columns
  - sky band with glass chip and parallax
  - 3 product modules (Find your path, Learn, Practice)
  - how it works (step tabs, word-blur carousel)
  - free to start
  - sample lessons
  - footer and storage notice

  It was verified against duna.com at 1440/768/390, and the verifier's P0/P1 findings were fixed.
- **Deliberate deviations (tell the owner):**
  1. How it works sits after the modules (on duna the quote section comes before the sky band).
  2. The Practice module is a full-width panel with its 4 micro-features in a row underneath, not a side accordion.
  3. How it works uses step tabs with a progress line plus a fragment panel instead of a logo selector and photo.
  4. The free-to-start band is mirrored (seals left, copy right, two actions).

  Also: the storage notice honestly says no ads and no tracking, instead of duna's cookie copy.
- **Pages:** `/lessons`, `/lessons/<slug>` ×3 (lesson detail), `/paths`, `/quiz` (working quiz on the app's own `public/quiz.mjs`, `?lesson=` support), `/pricing` (honest: everything is free, no paid plan exists), `/about`, `/login` and `/signup` (they use the real `public/auth.mjs` unchanged, then send learners to `/app`), `/terms`, `/privacy`, `/404`. Page CSS is in `site/styles/30–37-*.css`, scoped under each page's body class.
- **App:** the original SPA moved from `public/index.html` to `public/app.html`, served at `/app`; its logic is untouched. The layout forwards Supabase confirmation hashes (`#access_token=`) from any page to `/app`. Unknown pages now get the designed 404 locally too.
- **Images** (`scripts/generate-images.mjs`, `npm run images`, key read only from `process.env.GEMINI_API_KEY` in `.env.local`, which is gitignored): all seven watercolors in `public/assets/img/` were regenerated with Nano Banana Pro (`GEMINI_IMAGE_MODEL=gemini-3-pro-image-preview`).
- **/app restyle: done.** The learning app (home, sign-up/log-in, onboarding, dashboard, course and quiz hubs, lessons, quizzes, item shop, guide, toast, footer; day and night) uses the same system. Only presentation changed; auth, state, API calls and storage keys are untouched.
- **Full audit: done.** Every page and every app screen was checked at 1440/1024/768/390/360 by area agents, then by two final QA agents. Fixes include:
  - every page opens at the top, and `#anchors` land below the nav;
  - the logo spin, the level marquee and other perpetual motion are removed;
  - one section rhythm and one closing band on all inner pages;
  - menu, focus and keyboard fixes;
  - calm "sign-in unavailable" states;
  - the Sources & credits page (`/references`) is rebuilt in the new system.
- `npm test` passes (54 tests). No console errors, no horizontal overflow, no layout shift worth noting.

### What is left, in order

1. **Push.** GitHub returned 403 (the Claude GitHub App or connection lacks write access to this repo). Once the owner grants access, push `claude/duna-fairylearn-redesign-4oj514`. Only open a PR if the owner asks.
2. **Owner review.** Walk the site and app, and collect any taste-level changes.
3. **Optional:** the two accordions (modules, how it works) auto-advance like the reference. If the owner prefers them still, set `data-interval` very high or drop the timer in `site/scripts/20-features.js` and `33-how.js`.

### Working rules

- You are the orchestrator. Spawn subagents in parallel: one for the `/app` restyle, one or two to verify pages, then fixers. Give each subagent a strict file-ownership list. Subagents must not edit the foundation files listed above without reporting it.
- Use the local server for checks: `PORT=4100 node server.mjs` (restart it after adding new asset paths, because `site-files.json` is read at startup). Playwright and Chromium are preinstalled in Claude Code cloud sessions.
- Never print, log or commit API keys. `.env*` is gitignored; `.env.example` lists `GEMINI_API_KEY=`.
- Honest copy only: no invented metrics, customers, testimonials, people, prices or contact emails.
- Commit frequently with clear messages. Send short progress updates and screenshots after each finished page.
