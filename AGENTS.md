# AGENTS.md

Guidelines and project map for AI agents working on this site.
Luca Palomba's personal portfolio — a static site generated with Jekyll, deployed on GitHub Pages.

**This file is the single source of truth for any AI agent working on this repo (Claude Code, Cursor, Copilot, etc.).**

## Stack

- **Jekyll** (`github-pages` gem) as static site generator; Liquid templating.
- **Vanilla CSS** in `styles/` (fonts, transitions, main, mobile, mobile-small, reduced-motion, print-experiences). No framework, no build step.
- **Vanilla modular JavaScript** (ES-ish modules, loaded via `<script defer>`), no bundler.
- **Custom i18n** (`js/i18n.js`) based on `data-i18n` attributes + JSON files in `translations/`.
- **Deploy**: GitHub Actions → GitHub Pages. Lighthouse CI + htmlproofer in the workflow.

## Language conventions

- **Comments, file names, and commit messages must always be in English.** Never write comments, name files, or write commit messages in Italian.
- **Italian is acceptable only in two places:** (1) conversations with the AI agent, and (2) the site's UI/translated content for visitors (`translations/it.json` and any in-prose Italian shown on the site).
- This also applies to documentation files tracked by the repo: keep them in English.

## Workflow rules

Every AI agent session working on this repository MUST follow these rules. No exceptions.

### Worktrees only

- Start every task in a git worktree (e.g. under `.claude/worktrees/` for Claude Code), based on `origin/main` — never commit directly on `main`.
- Do not work, commit, or touch the `main` checkout during regular work.

### Pull requests, never local merges

- All changes go through a pull request to `main`: push the branch and open the PR. Never finish work with local `git merge` / `git rebase main`.
- Merging always happens on GitHub (e.g. `gh pr merge`) — never with local git commands, even when explicitly asked to merge.
- Never use `git push` to fast-forward or otherwise modify `main` directly.

### Markdown must pass markdownlint (gated)

Every `.md` file in this repo is linted by [markdownlint](https://github.com/DavidAnson/markdownlint). This is **enforced, not advisory**: a `markdownlint` check runs on every PR and is a required status check on `main`. Run it before opening a PR:

- Check: `npm run lint:md`
- Auto-fix what is fixable: `npm run lint:md:fix`

Notes for agents:

- Rules live in `.markdownlint.json`; the file set (globs) and ignores live in `.markdownlint-cli2.jsonc`. Change the rules there, never by adding inline disables to individual files.
- **`MD013` (line-length) is intentionally disabled.** `AGENTS.md` and `README.md` use one long line per entry, which keeps this project map readable. Do not re-enable it without rewriting those docs.
- Everything else is default. Fix the file rather than working around the rule.
- `.claude/worktrees/**` is excluded on purpose: worktrees are full repo copies, so linting them would double-count every file. Do not remove that ignore.
- A Claude Code hook also lints each `.md` immediately after it is written and returns the violations to the agent as feedback, so you will normally see them before you ever run the command. Note that this hook cannot block the write (`PostToolUse` runs after the tool has already executed) — the hook is a fast feedback loop, while the required CI check below is what actually prevents anything non-compliant from reaching `main`.

## Local commands

The environment has Ruby 3.4 + Bundler, but there is a `public_suffix` conflict (7 installed, Gemfile requires 5). **Always use `bundle exec`** for Jekyll commands.

- Production build: `bundle exec jekyll build`
- Local dev server: `bundle exec jekyll serve --config _config.yml,_config_local.yml --livereload`
  - `_config_local.yml` resets `baseurl` (in production it is `/lucapalomba`) so links work on `http://127.0.0.1:4000/`.
- Link check: `bundle exec htmlproofer ./_site --disable-external`
- Markdown lint: `npm run lint:md` (requires `npm ci` once; CI uses the same command)
- Markdown lint, auto-fix: `npm run lint:md:fix`

## Key conventions

- **Dual config**: `_config.yml` (prod, `baseurl: /lucapalomba`) + `_config_local.yml` (local, `baseurl: ""`). Links in markup are relative (`index.html`, `experiences.html`) and are resolved by Jekyll via `relative_url`.
- **i18n**: every UI string has `data-i18n="dotted.key"` (e.g. `nav.whoami`, `index.hero.title`); translations live in `translations/en.json` and `it.json`. For `aria-label`s use `data-i18n-aria`. The language is chosen from `localStorage('preferredLanguage')` then `navigator.language`, and saved on manual switch.
- **Page front matter**: supports `page_scripts` (list of additional JS paths loaded at the bottom) and `hide_nav_scripts` (disables `navigation.js`/`hamburger.js`). `body_class` marks the page (e.g. `experiences-page`, `technologies-page`, `contact-page`) — used by `i18n.js` for meta tags and by `techProgress.js` to activate animations.
- **Design system**: dark "terminal/developer" theme — background `#0a0a0f`, text `#e6e6ef`, violet accent `#B77EF1` (particles `#6e48aa`), monospace Roboto Mono (local in `fonts/`). CSS keyframe animations (hero, typing dots, transitions).
- **Commits (REQUIRED)**: **every** commit must use Conventional Commits as the message type — `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `build:`, `ci:`, `revert:`, etc. No commits without a type prefix. Work on separate branches / PRs; deploy happens only from `main`.

## Project map

### Config & build

- `_config.yml` — production Jekyll config (title, baseurl, plugins, jekyll-minifier, SEO/social).
- `_config_local.yml` — dev-local overrides (empty baseurl).
- `Gemfile` / `Gemfile.lock` — Ruby dependencies (`github-pages` + jekyll plugin). Use `bundle exec`.
- `package.json` / `package-lock.json` — **Node tooling only** (markdownlint-cli2), not a build step for the site. Run `npm ci` once after cloning.
- `.markdownlint.json` — markdownlint rule severity (`MD013` disabled on purpose).
- `.markdownlint-cli2.jsonc` — which files are linted and what is ignored (globs + ignores).
- `lighthouserc.json` — Lighthouse CI config (used by the workflow).
- `manifest.webmanifest` — PWA manifest: `display: standalone`, `scope: ./`, `purpose: any` icons at 192/512 plus a `maskable` 512. Declared `sizes` must match the real PNG dimensions — check the IHDR, not the file name.
- `sw.js` — service worker, at the repo root so its scope covers the whole site (GitHub Pages cannot send `Service-Worker-Allowed`). Precaches the page/CSS/JS/font shell; network-first for navigations with a cached fallback, cache-first for other same-origin GETs, and it ignores cross-origin requests (the particles CDN is opaque) and non-GET. Its cache version comes from the `?v=` the registration appends, so there is no constant to bump by hand. Must stay in `jekyll-minifier.exclude` (see gotchas).
- `scripts/generate-icons.js` — regenerates `images/icon-192.png`, `images/icon-512.png`, `images/icon-maskable-512.png` and `images/favicon-32.png` from the 460x460 master at `scripts/icon-source.png`. Zero dependencies (built-in `zlib` + a hand-rolled CRC32), deterministic, safe to re-run. The master lives under `scripts/` because that directory is excluded from the build.
- `.github/workflows/jekyll.yml` — CI: Jekyll build → htmlproofer → build for Lighthouse (mobile+desktop) → upload artifact → deploy to Pages (only from `main`).
- `.github/workflows/markdownlint.yml` — CI: `markdownlint` check (required status check on `main`).
- `.claude/settings.json` — shared Claude Code config, including the `markdownlint` hook.

### Layout & includes (Jekyll)

- `_layouts/default.html` — base layout: `html` dark, skip-link, transition overlay, navbar, `{{ content }}`, footer, scripts. All pages use `layout: default`.
- `_includes/head.html` — `<head>`: meta, local favicon + PWA icons (declared `sizes` match the real files), local Roboto Mono font, SEO/OG/Twitter, JSON-LD `Person`, manifest link, stylesheets (`fonts`, `transitions`, `main`, `mobile`, `mobile-small`, `reduced-motion`, `print-experiences`).
- `_includes/navbar.html` — sticky navbar with logo, desktop links (active state via `page.url` comparison), hamburger + mobile drawer, "Curriculum" CTA (LinkedIn link). Contains the drawer toggle logic.
- `_includes/footer.html` — footer: copyright, GitHub/LinkedIn links, "STATUS: NOMINAL" indicator.
- `_includes/scripts.html` — loads core JS (`i18n`, `main`, `transitions`) + conditionals (`navigation`, `hamburger` unless `hide_nav_scripts`) + `page_scripts` + `backToTop`, then the inline service-worker registration (baseurl-aware, cache version from `site.time`).
- `_includes/transition-overlay.html` — markup for the full-screen overlay used for page transitions (color-fill + smoke).
- `_includes/navigation-hint.html` — placeholder div for the "use ← → / swipe" hint shown by `navigation.js`.

### Pages

- `index.html` — home: hero (name + animated title + CTA). Loads `titleAnimation.js` via `page_scripts`.
- `experiences.html` — work experience timeline. Structure `.timeline` / `.timeline-item` with `.date`, `h2`, `.job-description`, `.key-project`, `.tech-stack`. Populated dynamically by `i18n.js` (array `experiences.jobs`). Has a print button + printable CSS.
- `technologies.html` — technologies grid with progress bars (`.tech-progress-fill` with `data-progress`) animated by `techProgress.js`. `body_class: technologies-page`.
- `contact.html` — contact page with form/links. `body_class: contact-page`.
- `404.html` — custom error page.

### JavaScript (`js/`)

- `i18n.js` — `I18n` class (exposed as `window.i18n`): language detection (localStorage → browser), fetch `translations/<lang>.json`, translate `data-i18n` / `data-i18n-aria` elements, update meta tags (title/description per page), render the experiences timeline, console easter egg, `switchLanguage()` + `getCurrentLanguage()`.
- `main.js` — post-DOMContentLoaded init: marks the transition overlay as `finished` after the entry (animations live in CSS).
- `transitions.js` — `PageTransition` class: intercepts clicks on internal links (excluding `target="_blank"` and skip-link), shows the overlay, waits ~660ms then navigates. Exit animation handled via the `active` class.
- `navigation.js` — circular navigation between the 4 pages with ← → arrows (keyboard) and swipe (touch, 100px threshold + horizontal guard). Shows and hides the navigation hint after 5s.
- `hamburger.js` — `HamburgerMenu` class: mobile drawer toggle, closes on internal link / Escape / outside click, locks body scroll when open.
- `backToTop.js` — creates the "Go to top" button, shows it after 300px of scroll, smooth scroll, integrates the `backToTop` translation.
- `titleAnimation.js` — `TitleAnimator` class: typewriter effect on `.hero-title` with 4 multilingual steps, keyword highlighting, keyboard sounds (pool of 3 audio per type from `sounds/`), restarts on click and language change (`i18n:languageChanged` event). Removes `data-i18n` so it is not overwritten.
- `techProgress.js` — animates the width of `.tech-progress-fill` to `data-progress`% after load, only on `technologies-page`.

### Styles (`styles/`)

- `main.css` — main global styles (component layout, timeline, keyframes, back-to-top, navigation-hint, etc.).
- `transitions.css` — transition overlay animations (color-fill, smoke, body fade-in).
- `reduced-motion.css` — loaded only with `prefers-reduced-motion: reduce`; disables animations/transitions.
- `print-experiences.css` — `media="print"` stylesheet for the printable CV version (experiences).
- `mobile.css` / `mobile-small.css` — responsive overrides for small screens.
- `fonts.css` — font definitions/overrides.

### Translations (`translations/`)

- `en.json` — English dictionary (nav, hero, experiences.jobs[], technologies, contact, title/description per page, consoleEasterEgg, backToTop).
- `it.json` — Italian dictionary, same structure.

### Assets

- `images/` — site images: the PWA icons (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`) and `favicon-32.png`, all generated by `scripts/generate-icons.js` — never hand-edit them.
- `fonts/` — local fonts (if present).
- `sounds/` — audio clips for `titleAnimation.js` (`keyboard-click.mp3`, `keyboard-click-delete.mp3`).
- `_site/` — build output (generated; do not commit manual edits).

## Notes / gotchas

- **`bundle exec` required** to avoid the `public_suffix` 7 vs 5 conflict.
- `sw.js` must stay listed in `jekyll-minifier.exclude`. It is a static file (no front matter), so the minifier would otherwise hand it to Uglifier, which cannot parse its `async`/`await`. The minifier only runs when `JEKYLL_ENV=production`, so getting this wrong breaks the Pages deploy and nothing else — a local `jekyll build` will not catch it.
- The service worker is registered from `_includes/scripts.html` with `{{ "/sw.js" | relative_url }}` and a `?v=` taken from `site.time`. Both halves matter: without `relative_url` the registration 404s in the Lighthouse build and locally (`baseurl: ""`), and without a changing `?v=` a deployed worker would never update.
- Adding a new page: create the `.html` with front matter `layout: default` + `body_class` + entry in `navigation.js` (`pages` array) + link in `navbar.html` + translations in both `translations/*.json` + meta keys `${page}.${titleKey}`/`description`. Also add it to `PRECACHE_URLS` in `sw.js`, or it will be unavailable offline.
- New strings must be added to **both** `en.json` and `it.json`, otherwise `i18n.js` shows the raw key.
- The `graphical-review` branch (PR #68, draft) contains a WIP graphical refactor (Tailwind CDN, EN/IT language selector, "kinetic" design) **not yet on main**. When working on main, ignore those sections; when working on `graphical-review`, AGENTS.md must be realigned to that branch.
