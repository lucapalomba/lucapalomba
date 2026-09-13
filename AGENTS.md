# AGENTS.md

Guidelines and project map for AI agents working on this site.
Luca Palomba's personal portfolio — a static site generated with Jekyll, deployed on GitHub Pages.

**This file is the single source of truth for any AI agent working on this repo (Claude Code, Cursor, Copilot, etc.).**

## Stack

- **Jekyll** (`github-pages` gem) as static site generator; Liquid templating.
- **Vanilla CSS** in `styles/` (fonts, transitions, main, mobile, mobile-small, reduced-motion, print-experiences). No framework, no build step.
- **Vanilla modular JavaScript** (ES-ish modules, loaded via `<script defer>`), no bundler.
- **Custom i18n, rendered by Jekyll** from `_data/translations/{en,it}.json`. There is no client-side translation layer: every string is in the HTML of the page it belongs to.
- **Deploy**: GitHub Actions → GitHub Pages. Lighthouse CI + htmlproofer in the workflow.

## Language conventions

- **Comments, file names, commit messages, and PR titles/descriptions must always be in English.** Never write comments, name files, or write commit messages / PR descriptions in Italian.
- **Italian is acceptable only in two places:** (1) conversations with the AI agent, and (2) the site's UI/translated content for visitors (`_data/translations/it.json` and any in-prose Italian shown on the site).
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
- i18n integrity check: `node scripts/check-i18n.js` (also runs in CI, before the build)

## Key conventions

- **Dual config**: `_config.yml` (prod, `baseurl: /lucapalomba`) + `_config_local.yml` (local, `baseurl: ""`). Links in markup are relative (`index.html`, `experiences.html`) and are resolved by Jekyll via `relative_url`.
- **i18n (server-side)**: every string is rendered by Jekyll, so the HTML is complete before any JavaScript runs (no text flash, crawler-visible). All copy lives in `_data/translations/{en,it}.json` and layouts render it as `{{ t.a.dotted.key }}` — never hardcode a string in markup, and never reintroduce `data-i18n` attributes. The active dictionary is `t`, assigned at the top of `_layouts/default.html` and of every page layout; the language is `page.lang`.
- **Language pairing (front matter)**: `lang` (`en`/`it`) selects the dictionary; `i18n_key` selects the copy block and drives `<title>`/description via `t[page.i18n_key]`; `alt_url` + `alt_lang` point at the page's counterpart in the other language and are emitted as `hreflang`. The pairing is mutual — the counterpart must point back. `no_alternate: true` marks a page with no counterpart (the 404). `scripts/check-i18n.js` enforces all of this.
- **Page front matter**: also supports `page_scripts` (list of additional JS paths loaded at the bottom), `hide_nav_scripts` (disables `navigation.js`/`hamburger.js`) and `body_class` (`technologies-page` is what `techProgress.js` looks for; `not-found-page` suppresses the navigation hint). Client-side scripts that need to know which page they are on read `document.body.dataset.page` (the `i18n_key`), not the URL.
- **Design system**: dark "Obsidian Precision" theme — surfaces from `--surface-container-lowest` `#0c0e14` up to `--surface-container-highest` `#33343b`, page `#111319`; text `--on-surface` `#e2e2ea`; cyan accent `--primary` `#4cd7f6` (text/icons) + `--primary-container` `#06b6d4` (fills). Geist for UI, JetBrains Mono for technical labels, both self-hosted in `fonts/`. Tokens live in `styles/tokens.css` (the old `--bg-color` / `--accent-color` / `--font-main` names are deprecated aliases there); components in `styles/components.css`, page compositions in `styles/pages.css`, motion in `styles/motion.css`. Icons are inline SVG via `_includes/icon.html`, not an icon font. The plan is `docs/design-system-revamp.md`.
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

- `_layouts/default.html` — base layout: `<html lang>`, skip-link, transition overlay, navbar, `{{ content }}`, footer, back-to-top, navigation hint, scripts. All pages use it. It assigns `t = site.data.translations[page.lang]` — a Jekyll `include` gets its own Liquid scope, so any file that renders a translated string must assign `t` itself rather than rely on the caller.
- `_layouts/{home,experiences,technologies,contact,error}.html` — one layout per page, holding that page's markup **once**, translated. The EN and IT pages are thin front-matter files that both point at the same layout, so there is no duplicated markup between languages.
- `_includes/head.html` — `<head>`: title/description/OG/Twitter/JSON-LD built from `t[page.i18n_key]`, `og:locale` + `og:locale:alternate`, a self-referential canonical and the `hreflang` alternates, local favicon + PWA icons (declared `sizes` match the real files), the self-hosted Geist/JetBrains Mono preloads, JSON-LD `Person` (props from `_data/person.yml` via `_includes/jsonld-person-props.html`, shared with `_layouts/contact.html`), manifest link, stylesheets (`fonts`, `tokens`, `components`, `transitions`, `main`, `motion`, `pages`, `mobile`, `mobile-small`, `reduced-motion`, `print-experiences`), and the inline ES5 language hand-off (see below).
- `_includes/icon.html` — inline SVG icon sprite. `{% include icon.html name="terminal" %}` renders a 24x24 `currentColor` stroke icon, `aria-hidden`; an unknown name renders nothing. Line-art from Lucide (ISC), so no icon font request.
- `_includes/navbar.html` — sticky navbar with the `<LP />` brand, server-rendered links (active state via `page.i18n_key`), the availability badge with a single-cycle ping, the language switcher (from `page.alt_url`, rendered in both the desktop row and the mobile drawer), hamburger + mobile drawer, "Curriculum" CTA (LinkedIn link). Contains the drawer toggle logic. The typewriter sound toggle and its audio were removed with the revamp (D6), so `js/soundMute.js` and `sounds/` are gone.
- `_includes/footer.html` — footer: provenance line, GitHub/LinkedIn links (real URLs from `_data/person.yml`), and a copyright year rendered from `site.time` so it cannot go stale.
- `_includes/back-to-top.html` — the "back to top" button, server-rendered and translated (CSS keeps it hidden until scrolled).
- `_includes/scripts.html` — loads core JS (`langPref`, `main`, `transitions`) + conditionals (`navigation`, `hamburger` unless `hide_nav_scripts`) + `page_scripts` + `backToTop`, prints the console easter egg from `t.consoleEasterEgg`, then the inline service-worker registration (baseurl-aware, cache version from `site.time`).
- `_includes/transition-overlay.html` — markup for the full-screen overlay used for page transitions (color-fill + smoke).
- `_includes/navigation-hint.html` — both hint variants server-rendered (keyboard and touch, switched by a CSS media query); `navigation.js` only toggles `aria-hidden`.

### Pages

- `index.html` — home: `layout: home`, `i18n_key: index`. Hero (intro, name, animated title, subtitle, bio, CTA) plus a `#hero-animation` JSON blob carrying the typewriter steps and the sound base. Loads `titleAnimation.js` via `page_scripts`.
- `experiences.html` — work experience timeline. Structure `.timeline` / `.timeline-item` with `.date`, `h2`, `.job-description`, `.key-project`, `.tech-stack`, rendered by Jekyll from the `t.experiences.jobs` array. Has a print button + printable CSS.
- `technologies.html` — technologies grid with progress bars (`.tech-progress-fill` with `data-progress`) animated by `techProgress.js`. The editorial order, percentage and particle count per row live in the layout as a `key:percentage:particles` table.
- `contact.html` — contact page with links. `layout: contact`.
- `404.html` — custom error page, `layout: error` and `no_alternate: true` (there is deliberately no Italian 404: GitHub Pages serves a second one with HTTP 200, i.e. a soft 404).
- `it/{index,experiences,technologies,contact}.html` — the Italian counterparts of the four pages: `lang: it`, same `i18n_key`, and `alt_url` pointing back at the English file.

### JavaScript (`js/`)

- `langPref.js` — records the visitor's manual language choice (`localStorage.preferredLanguage`) when a `.lang-switch` link is clicked; the hand-off script in `head.html` reads it on the next visit to the language root. Nothing else.
- `main.js` — post-DOMContentLoaded init: marks the transition overlay as `finished` after the entry (animations live in CSS).
- `transitions.js` — `PageTransition` class: intercepts clicks on internal links (excluding `target="_blank"` and skip-link), shows the overlay, waits ~660ms then navigates. Exit animation handled via the `active` class.
- `navigation.js` — circular navigation between the 4 pages with ← → arrows (keyboard) and swipe (touch, 100px threshold + horizontal guard), staying inside the current language. Reads the current page from `document.body.dataset.page` and navigates through relative URLs, so it works from `/it/` too. Reveals the navigation hint (once per session) and fades it after 5s.
- `hamburger.js` — `HamburgerMenu` class: mobile drawer toggle, closes on internal link / Escape / outside click, locks body scroll when open.
- `backToTop.js` — drives the server-rendered `.back-to-top-btn`: adds `.visible` past 300px of scroll, scrolls to top honouring `prefers-reduced-motion`.
- `motion.js` — adds `.in` to `.reveal`, `.sparkline-draw` and `.timeline-fill` the first time they enter the viewport (IntersectionObserver, same pattern as `techProgress.js`), then unobserves. Skips observing entirely under `prefers-reduced-motion`; the motion vocabulary itself lives in `styles/motion.css`.
- `contactCopy.js` — contact page: copies the email address with a visible label swap and an `aria-live` announcement, plus a non-blocking failure path.
- `techProgress.js` — animates `.tech-progress-fill` widths on scroll and drives the technologies category filter (live count, `aria-pressed`, empty state), refilling cards the filter reveals.
- `titleAnimation.js` — `TitleAnimator` class: typewriter effect on `.hero-title`, keyword highlighting, restarts on click. Its steps come from the `#hero-animation` JSON rendered by the home layout, so it plays the page's own language. Audio was removed with the revamp (D6).

### Styles (`styles/`)

- `tokens.css` — design tokens (surfaces, text, accents, spacing, radii, type scale, motion) plus the deprecated aliases for the old token names. Loaded first.
- `components.css` — layout container/grid and the component primitives (section header, card, chip, badge, stat tile, kv-row, buttons, ping-dot, progress, sparkline).
- `main.css` — global and component styles that predate the primitives (navbar, mobile drawer, timeline, back-to-top, console/hint, etc.).
- `pages.css` — per-page compositions (home hero + telemetry, experience sidebar, technologies matrix/filter/spectrum, contact dispatch, 404).
- `motion.css` — the authored motion layer (reveal, sparkline draw, timeline fill, single-cycle ping), all reduced-motion aware.
- `transitions.css` — the short opacity page-transition overlay.
- `reduced-motion.css` — loaded only with `prefers-reduced-motion: reduce`; disables animations/transitions.
- `print-experiences.css` — `media="print"` stylesheet for the printable CV version (experiences).
- `mobile.css` / `mobile-small.css` — responsive overrides for small screens.
- `fonts.css` — self-hosted `@font-face` definitions for Geist and JetBrains Mono.

### Translations (`_data/translations/`)

- `en.json` — English dictionary: `nav`, `a11y`, `index` (incl. `hero.steps[]`), `experiences.jobs[]`, `technologies` (`tech` + `desc` keyed by tech id), `contact`, `notFound`, `consoleEasterEgg`, `backToTop`, `navigation`, plus `pageTitle`/`description` per page and `ogLocale`.
- `it.json` — Italian dictionary, same structure. Both must change together: `scripts/check-i18n.js` compares the two shapes and fails if a `t.…` reference resolves in one language only.

### Assets

- `images/` — site images: the PWA icons (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`) and `favicon-32.png`, all generated by `scripts/generate-icons.js` — never hand-edit them.
- `fonts/` — local fonts (if present).
- `sounds/` — removed with the revamp; the typewriter no longer plays audio (D6).
- `_site/` — build output (generated; do not commit manual edits).

### Docs (`docs/`)

Repo documentation. Excluded from the Jekyll build in `_config.yml`, because it is not site content and the vendored design export is ~3 MB.

- `design-system-revamp.md` — the plan and subtask checklist for replacing the current theme with the "Obsidian Precision" design system. Read this before any visual work: it records the design tokens, the gap analysis, the decisions that need Luca's call, and the dead code in the mockups that must not be ported.
- `design/stitch/` — the vendored Google Stitch export the plan refers to: one `code.html` mockup + `screen.png` per screen, plus `obsidian_precision/DESIGN.md` (the token spec). Committed verbatim from the export; do not reformat it. It is ignored by markdownlint for that reason, and it is reference material, not a codebase — see the plan for what is dead code in it.

## Notes / gotchas

- **`bundle exec` required** to avoid the `public_suffix` 7 vs 5 conflict.
- `sw.js` must stay listed in `jekyll-minifier.exclude`. It is a static file (no front matter), so the minifier would otherwise hand it to Uglifier, which cannot parse its `async`/`await`. The minifier only runs when `JEKYLL_ENV=production`, so getting this wrong breaks the Pages deploy and nothing else — a local `jekyll build` will not catch it.
- The service worker is registered from `_includes/scripts.html` with `{{ "/sw.js" | relative_url }}` and a `?v=` taken from `site.time`. Both halves matter: without `relative_url` the registration 404s in the Lighthouse build and locally (`baseurl: ""`), and without a changing `?v=` a deployed worker would never update.
- Adding a new page: add a page layout holding the markup with `{{ t.… }}`, then the thin EN page and its IT counterpart with `lang` + `i18n_key` + reciprocal `alt_url`/`alt_lang`, an entry in `navigation.js` (`pages` array), a link in `navbar.html`, and `pageTitle` + `description` for the new `i18n_key` in both dictionaries. `scripts/check-i18n.js` fails until the pairing is reciprocal. Also add the page to `PRECACHE_URLS` in `sw.js`, in both languages, or it will be unavailable offline.
- New strings must be added to **both** `_data/translations/en.json` and `it.json`; `scripts/check-i18n.js` fails the build when a `t.…` reference resolves in one language only.
- The language root (`/`) is English and carries the only language hand-off: a tiny ES5 script that reads `localStorage.preferredLanguage`, then `navigator.language`, and redirects Italian visitors to `/it/`. It must stay ES5 (the CI minifier parses it as ES5) and must never run on a deep page — an unrequested redirect there would cost the visitor their link and the crawler the canonical.
- The `graphical-review` branch (PR #68, draft) contains a WIP graphical refactor (Tailwind CDN, EN/IT language selector, "kinetic" design) **not yet on main**. When working on main, ignore those sections; when working on `graphical-review`, AGENTS.md must be realigned to that branch.
