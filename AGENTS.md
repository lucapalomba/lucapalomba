# AGENTS.md

Guidelines and project map for AI agents working on this site.
Luca Palomba's personal portfolio — a static site generated with Jekyll, deployed on GitHub Pages.

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

## Local commands

The environment has Ruby 3.4 + Bundler, but there is a `public_suffix` conflict (7 installed, Gemfile requires 5). **Always use `bundle exec`** for Jekyll commands.

- Production build: `bundle exec jekyll build`
- Local dev server: `bundle exec jekyll serve --config _config.yml,_config_local.yml --livereload`
  - `_config_local.yml` resets `baseurl` (in production it is `/lucapalomba`) so links work on `http://127.0.0.1:4000/`.
- Link check: `bundle exec htmlproofer ./_site --disable-external`

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
- `lighthouserc.json` — Lighthouse CI config (used by the workflow).
- `manifest.webmanifest` — PWA manifest.
- `.github/workflows/jekyll.yml` — CI: Jekyll build → htmlproofer → build for Lighthouse (mobile+desktop) → upload artifact → deploy to Pages (only from `main`).

### Layout & includes (Jekyll)
- `_layouts/default.html` — base layout: `html` dark, skip-link, transition overlay, navbar, `{{ content }}`, footer, scripts. All pages use `layout: default`.
- `_includes/head.html` — `<head>`: meta, favicon (from GitHub avatar), local Roboto Mono font, SEO/OG/Twitter, JSON-LD `Person`, stylesheets (`fonts`, `transitions`, `main`, `mobile`, `mobile-small`, `reduced-motion`, `print-experiences`).
- `_includes/navbar.html` — sticky navbar with logo, desktop links (active state via `page.url` comparison), hamburger + mobile drawer, "Curriculum" CTA (LinkedIn link). Contains the drawer toggle logic.
- `_includes/footer.html` — footer: copyright, GitHub/LinkedIn links, "STATUS: NOMINAL" indicator.
- `_includes/scripts.html` — loads core JS (`i18n`, `main`, `transitions`) + conditionals (`navigation`, `hamburger` unless `hide_nav_scripts`) + `page_scripts` + `backToTop`.
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
- `images/` — site images.
- `fonts/` — local fonts (if present).
- `sounds/` — audio clips for `titleAnimation.js` (`keyboard-click.mp3`, `keyboard-click-delete.mp3`).
- `_site/` — build output (generated; do not commit manual edits).

## Notes / gotchas

- **`bundle exec` required** to avoid the `public_suffix` 7 vs 5 conflict.
- Adding a new page: create the `.html` with front matter `layout: default` + `body_class` + entry in `navigation.js` (`pages` array) + link in `navbar.html` + translations in both `translations/*.json` + meta keys `${page}.${titleKey}`/`description`.
- New strings must be added to **both** `en.json` and `it.json`, otherwise `i18n.js` shows the raw key.
- The `graphical-review` branch (PR #68, draft) contains a WIP graphical refactor (Tailwind CDN, EN/IT language selector, "kinetic" design) **not yet on main**. When working on main, ignore those sections; when working on `graphical-review`, AGENTS.md must be realigned to that branch.
