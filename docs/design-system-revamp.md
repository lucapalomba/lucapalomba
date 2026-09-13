# Obsidian Precision — design system revamp

Tracking document for replacing the current "violet terminal" theme with the **Obsidian Precision** design system.

This PR is **documentation and design reference only** — it changes no production code, no CSS, no JS. It commits the design export, records the gap between what the site is and what the design asks for, lists the decisions that need Luca's call, and breaks the adaptation into reviewable subtasks (section [Subtasks](#subtasks)).

## Source of the design

The design was produced with [Google Stitch](https://stitch.withgoogle.com/) and exported as one folder per screen. The export is committed verbatim under [`docs/design/stitch/`](design/stitch/) so that every future worktree and every agent has the reference locally.

Each screen folder holds `code.html` (a Tailwind-CDN mockup) and `screen.png` (the rendered preview). The token spec is [`docs/design/stitch/obsidian_precision/DESIGN.md`](design/stitch/obsidian_precision/DESIGN.md).

The export shipped in two generations, and this plan is based on the **second**:

- The **first** exported every route twice — a desktop variant and a `_mobile_responsive` one — and three of its five desktop screenshots were empty 28-byte stubs. It has been dropped from the tree: superseded on every route it covered, it could only mislead a reader into porting a screen the design has since replaced. Git history still holds it.
- The **second** (`_unified_motion_text_fx`) replaces each desktop/mobile pair with a single responsive file and adds the motion layer. It is what the table below lists.

| Page | Mockup | Screenshot |
| --- | --- | --- |
| 01 — Who am I | `luca_palomba_01._who_am_i_unified_motion_text_fx` | 1920×2908 |
| 02 — Experience | `luca_palomba_02._experience_unified_motion_text_fx` | 1920×4525 |
| 03 — Technologies | `luca_palomba_03._technologies_unified_motion_text_fx` | 889×1600 |
| 04 — Contact | `luca_palomba_04._contact_unified_motion_text_fx` | 1600×1514 |
| 404 | `luca_palomba_404_not_found_simplified` + `luca_palomba_404_not_found_mobile_responsive` | both available |

Two things to know before reading the mockups:

- **The screenshots do not all show the desktop layout.** Pages 01 and 02 are captured at 1920px wide; page 03 is 889px (a narrow/tablet render) and page 04 is 1600px but short. For the 1200px 12-column composition — asymmetric grids, the sticky telemetry sidebar, the 3-up bento — `code.html` is the reference, not the PNG.
- **The mockups are reference, not a codebase.** They are single-file Tailwind-CDN prototypes with copy-pasted chrome, copied-in copy that disagrees between files, dead code and placeholder links. See [Export inconsistencies](#export-inconsistencies) and [What must not be ported](#what-must-not-be-ported).

## What the design system is

"Obsidian Precision" is an executive, engineering-driven dark theme — explicitly positioned against the current theme's gimmicks (the spec calls out "no glowing hacker scanlines, exaggerated neon grids, or heavy console gimmicks"), aiming at the register of Linear, Vercel and Raycast.

### Colors

| Role | Token | Value |
| --- | --- | --- |
| Canvas base | `surface-container-lowest` | `#0c0e14` |
| Page background | `background` / `surface` | `#111319` |
| Elevation 1 (recessed containers, table headers) | `surface-container-low` | `#191b22` |
| Elevation 2 (cards, panels) | `surface-container` | `#1d1f26` |
| Elevation 3 (hover, popovers) | `surface-container-high` | `#282a30` |
| Chips / strongest surface | `surface-container-highest` | `#33343b` |
| Text primary | `on-surface` | `#e2e2ea` |
| Text secondary | `on-surface-variant` | `#bcc9cd` |
| Text muted / metadata | `outline` | `#869397` |
| Accent (text, icons, small fills) | `primary` | `#4cd7f6` |
| Accent (solid fills, buttons) | `primary-container` | `#06b6d4` |
| Secondary accent (diagrams, tags) | `secondary` | `#adc6ff` |
| Operational / success | `tertiary` | `#4edea3` |
| Error | `error` | `#ffb4ab` |
| Subtle border | — | `rgba(255, 255, 255, 0.07)` |
| Strong border | `outline-variant` | `#3d494c` |

Depth comes from surface luminance plus 1px micro-borders, **not** from drop shadows. The only shadows in the spec are a directional top-edge highlight on floating cards and `0 8px 24px -6px rgba(0, 0, 0, 0.5)` on hover.

`DESIGN.md` also names two canvas colors that are not in the token block — `#0c0d10` (canvas base) and `#14161b` / `#1a1d24` / `#222630` (elevations 1–3) — which do not match the token values above. The implementation must pick one set. See [D1](#decisions-needed).

### Typography

Two families, both currently external in the mockups (Google Fonts):

- **Geist** — all narrative and structural type. Weights 400/500/600 only; the spec forbids going above 600 and says weight comes from tonal contrast instead.
- **JetBrains Mono** — technical specifics only: metrics, labels, commit hashes, badges, status values, inline code. Labels are uppercase with `0.04em`–`0.06em` positive tracking; numerals are tabular.

Scale: `display` 3.5rem/600 → `display-mobile` 2.25rem → `headline-lg` 2.25rem → `headline-md` 1.5rem → `headline-sm` 1.125rem → `body-lg` 1.125rem → `body-md` 0.9375rem → `body-sm` 0.8125rem → `label-md`/`label-sm` (mono).

### Grid, spacing, shape

- Max width **1200px**. Desktop 1024px+: 12 columns, 24px gutter, 32px margin. Tablet 768–1023px: 8 columns, 20px gutter, 24px margin. Mobile ≤767px: 4 columns collapsing to a single stack, 16px gutter and margin.
- Spacing scale: `xs` 0.25rem, `sm` 0.5rem, `md` 1rem, `lg` 1.5rem, `xl` 2.5rem — strictly 8px multiples; `xl` is reserved for division between major sections.
- Radii: `0.125rem` controls/tags, `0.25rem` buttons, `0.5rem` cards, `0.75rem` overlays/modals. Pills are explicitly excluded as an aesthetic choice; circular shapes only for avatars and status dots.

### Component vocabulary

Navbar (64px, blurred translucent), section header (`NN.N //` mono kicker + headline), project/metric card, stat tile (label / value / sub-value), chip and badge, status dot with a single ping cycle, key–value metadata row, primary/secondary/ghost buttons, code viewer, terminal/ledger block, sparkline SVG, progress bar, segmented distribution bar, prev/next progression strip, footer.

### Motion

**`DESIGN.md` specifies no motion at all.** It mentions animation exactly twice, both incidentally — hover transitions on floating cards, and "successful or live statuses feature a non-distracting single-cycle ping animation" on status dots. There are no durations, no easing curves, no choreography, no `prefers-reduced-motion` policy. Motion is therefore **not something to port from the reference; it has to be authored**, and R19 is where it gets designed rather than copied.

The second-generation export does add a motion layer per route, but each file defines its vocabulary inline and they share nothing: `fadeSlideUp` is the only keyframe that appears in more than one file, and even it is consumed through different class names. Across the four files there are roughly sixteen named primitives, and they do not agree on easing, duration or iteration:

| Primitive | In | What it is | Verdict |
| --- | --- | --- | --- |
| `fadeSlideUp` — 0.7–0.9s, `cubic-bezier(0.16, 1, 0.3, 1)` | 01, 02 | Entrance: opacity 0→1, `translateY(18px)`→0 | Keep as the base reveal |
| `sparkline-draw` — 2.4s, one-shot | 01 | SVG `stroke-dashoffset` self-draw of the telemetry line | Keep; one-shot, cheap, reads as "instrument" |
| `timelineFill` — 1.4s, `scaleX(0)`→`scaleX(1)`, staggered 0.1–0.7s | 02 | Career-timeline bars filling | Keep the idea, fix the origin (below) |
| `ping-dot` — 2s, infinite | 01 | Status-dot scale + opacity ping | Keep, corrected to a single cycle per the spec |
| `text-shimmer` / `cyan-shimmer` — 8s, infinite | 01, 02 | Gradient sweeping across the display headings | For D13 — the signature effect, and the most visible perpetual loop |
| `pulse-glow` — 2.5s, infinite, `filter: drop-shadow()` | 01, 03 (10×) | Glow pulse on dots, badges and every progress bar | Drop — paint-bound, and it is on ten elements |
| `shimmerLoop`, `subtlePulse`, `techGradientShimmer` | 03 | Card and badge shimmer | Drop — same register, more loops |
| `scanlineGlow` — 5s, infinite | 02 | Light band sweeping the sticky sidebar | Drop — it moves across body copy the user is reading |
| Tailwind `animate-ping` / `animate-pulse` | all four | Infinite | Drop — directly contradicts the spec's "single-cycle ping" |
| `cardCascade`, `techReveal`, `eqBar`, `radarRing` | 03, 04 | Intended entrance choreography | Not wired up — see below |

Three properties of that layer matter more than the inventory:

- **The entrance choreography is dead in all four files, and dead in two different ways.** The classes are either declared and never applied (`.reveal-1/2/3` in 01, `.stagger-card` in 02) or applied and never declared (`card-cascade`, `cascade-delay-1`–`5`, `tech-reveal`, `tech-reveal-delay-1`, `cascade-card` across 01, 02, 03, 04). Every stagger delay in the markup is inert, so cards that were meant to cascade render at full opacity, and Contact has no entrance animation at all — not even its `<h1>`, which carries a `0.1s` delay on a class that does not exist. It reads as a half-finished rename (`reveal-*` → `card-cascade` → `stagger-card`) that was never completed on either side.
- **Nothing is scroll-triggered.** Every animation starts at parse time, so anything below the fold has already finished by the time it is seen — the counters count up off-screen on mobile. There is no `IntersectionObserver` and no scroll listener in any of the four files. The site is ahead here: `js/techProgress.js` already does the right thing.
- **There is no `prefers-reduced-motion` anywhere in the export** — zero occurrences in all four files — while the site honours it in `styles/reduced-motion.css` and `js/techProgress.js`. Porting the export's motion as written would be an accessibility regression against the current site, and `DESIGN.md`'s own "non-distracting" language argues against the perpetual loops.

The intended register is one or two *earned* one-shot reveals plus a single live signal (the status ping). What the export actually ships is a perpetual-motion layer: a full-viewport canvas animation, an infinite glow on ten elements, three shimmer loops, a sweeping scanline, and a count-up that finishes before you arrive.

## Gap analysis

| Dimension | Today | Target |
| --- | --- | --- |
| Accent | Violet `#B77EF1` everywhere | Cyan `#4cd7f6` (text/icons) + `#06b6d4` (fills); violet removed |
| Canvas | `#0a0a0f` | `#111319` page, `#0c0e14` recessed canvas |
| Type | Roboto Mono for everything | Geist (UI) + JetBrains Mono (technical), self-hosted |
| Icons | Inline SVG, hand-written per use | Material Symbols in the mockups — to be replaced by a single inline SVG sprite |
| Layout | `.container` capped at 900px | 1200px, 12/8/4-column responsive grid |
| Components | Ad-hoc classes (`.timeline-item`, `.tech-progress-fill`, …) | Named primitives (card, chip, stat tile, button, kv-row, section header) |
| Depth | No surface tiers | 4 surface tiers + micro-borders replacing shadows |
| Motion | CSS keyframes in `main.css` (hero, typing dots, transitions); `techProgress.js` animates the bars on scroll via `IntersectionObserver`; `reduced-motion.css` honoured | The export's motion layer is a set of per-file prototypes with no shared vocabulary, no scroll triggering and no reduced-motion — see [Motion](#motion). To be authored, not ported (D13, R19) |
| Chrome | particles.js field, colour-fill + smoke page transition, typewriter with sound, arrow/swipe nav with hint | To be decided per item — see [D4–D7](#decisions-needed) |
| Mobile nav | Fixed navbar + hamburger drawer | The motion export has no mobile navigation at all — see [D8](#decisions-needed) |
| 404 | Minimal error page with nav links hidden | Full-chrome page with CTAs and quick-jump links |

The content itself carries over: the mockups reuse the existing copy (hero, bio, all 7 experience entries, the 10 technologies, contact text) and add new authored copy around it (pillars, principles, telemetry labels, statuses).

## Hard constraints

These are properties of this repository that the revamp must preserve. They override anything the mockups do.

1. **No Tailwind, no build step.** The mockups use the Tailwind Play CDN and a runtime `tailwind.config`. The site is hand-written CSS in `styles/` with no bundler. Port the tokens to CSS custom properties and the components to plain classes.
2. **No new external runtime dependencies.** Fonts are self-hosted in `fonts/` and preloaded; there is no CDN in the critical path today. Geist and JetBrains Mono must be self-hosted as woff2 (with their licences), and Material Symbols must not be loaded from Google Fonts.
3. **i18n parity.** Every user-visible string needs `data-i18n` / `data-i18n-aria` and entries in **both** `translations/en.json` and `translations/it.json`. `node scripts/check-i18n.js` runs in CI and fails on any missing key or shape drift, including array-length drift in `experiences.jobs`.
4. **Lighthouse ≥ 0.90 on all four categories**, mobile and desktop (`.github/workflows/jekyll.yml`). This is a real constraint on fonts, LCP and added markup.
5. **markdownlint is a required check.** `npm run lint:md`. Fix files; do not add inline disables.
6. **Worktrees + PRs only.** Start in a worktree based on `origin/main`, never commit on `main`, merge on GitHub.
7. **Conventional Commits** on every commit.
8. **The print stylesheet must keep working.** `styles/print-experiences.css` turns the experience page into a CV for printing.
9. **`prefers-reduced-motion` is honoured today** (`styles/reduced-motion.css`, `js/techProgress.js`); the export has no reduced-motion handling in any file. Whatever motion is ported must be reduced-motion-aware, and the site must not regress on this. The same goes for scroll triggering: the export animates everything at parse time, while `js/techProgress.js` already gates on an `IntersectionObserver`.
10. **Stable URLs and i18n keys.** Do not rename translation keys or page URLs as part of a visual revamp.
11. **Motion is authored, not ported.** `DESIGN.md` defines no durations, easings or choreography, so there is no motion system in the reference to copy — only per-file prototypes that contradict each other and the spec. R19 designs the motion layer; the export's implementations are evidence of intent, not a source.

## Decisions needed

Each item below changes the implementation, so it needs an answer before the subtask it blocks. The recommendation is mine, not a decision.

- **D1 — Which colour wins?** The token block and the prose in `DESIGN.md` disagree (`primary` is `#4cd7f6` while the prose calls `#06b6d4` the "primary interactive accent"), and the canvas is `#0c0d10` in prose vs `#0c0e14` in tokens, with a second, different elevation ladder in prose. *Recommendation:* keep both cyans with a usage rule — `#4cd7f6` for accent text/icons/small strokes (it has the contrast), `#06b6d4` for solid fills — and adopt the **token block** values as canonical for surfaces, since that is what the mockups actually render. Blocks R01.
- **D2 — Invented metrics.** The mockups present specific numbers as facts: Tech Debt Burn 85%, Friday Deploys 0.00, Sprint Velocity +42%, CI Build Health 99.8%, SLO 99.95%, `OPEX_REDUCTION: ~50% in 12 Months`, `LEADERSHIP_MAX: 20 Engineers / 4 Squads`, `v4.18.0`, "18+ Years Active". These read as marketing figures. They need either Luca's sign-off, a real source, or replacement with non-numeric framing. *Recommendation:* keep the labels, drop or confirm each number — a portfolio that states an unverifiable SLO is worse than one that states none. Blocks R09, R10.
- **D3 — Availability badge.** Three different strings exist (`Available for Staff Roles`, `Available for H2 2025`, `Avail for Q3`), two of them stale-dated. *Recommendation:* one keyed string in `en.json`/`it.json`, undated or dated from a single place, plus the ping dot. Blocks R05.
- **D4 — particles.js.** The background particle field is a violet accent effect that neither the spec nor any mockup includes. *Recommendation:* remove it (with `js/particles.min.js` and its CSS), or keep it recoloured to low-alpha cyan if the motion is wanted. Blocks R08.
- **D5 — Page transition overlay.** The colour-fill + smoke transition (`styles/transitions.css`, `js/transitions.js`) is the opposite of the spec's restraint. *Recommendation:* replace with a short opacity/translate fade, keeping the class contract so `js/main.js` and `js/transitions.js` need no rewrite.
- **D6 — Typewriter and keyboard sounds.** `js/titleAnimation.js` types the hero title with keyboard audio and now has a mute toggle. The spec explicitly rejects "heavy console gimmicks". *Recommendation:* keep the typewriter (it is the site's signature) but drop the audio, which also retires `js/soundMute.js` and `sounds/`. Blocks R08, R09.
- **D7 — Arrow/swipe navigation and the hint.** `js/navigation.js` cycles pages with ← → and touch swipes; the mockups replace this with prev/next progression strips at the bottom of each page. *Recommendation:* keep the strips as the visible affordance and keep keyboard arrows (they cost nothing and are a11y-positive), but drop the floating hint. Blocks R06, R10.
- **D8 — Mobile navigation.** *Recommendation changed by the second-generation export.* The first export used a fixed bottom tab bar with safe-area padding; the motion export **has no mobile navigation at all** — the navbar is `hidden md:flex` with no `md:hidden` counterpart, and there is no drawer, no tab bar and no safe-area inset anywhere in the four files. There is no mobile pattern left to adopt. *Recommendation (revised):* keep the existing hamburger drawer (`js/hamburger.js`, `#mobile-nav`) — it is the only working mobile affordance in either the site or the reference — and restyle it to the design's surfaces and type. Delete nothing. A bottom bar would now have to be designed from scratch, since the reference no longer shows one. Blocks R06.
- **D9 — Which 404?** `404_not_found_simplified` is the only self-sufficient variant (works 375px→1200px, full chrome, consistent nav vocabulary, canonical content) and should be the base; `404_not_found_mobile_responsive` is fixed-width and uses a conflicting `overview/architecture/stack/contact` vocabulary. The 404 is also the one route the motion export does not cover, so these remain first-generation files. *Recommendation:* implement `simplified`. Blocks R13.
- **D10 — Hidden scrollbar.** Every mockup hides the scrollbar globally (`::-webkit-scrollbar { display: none }`). *Recommendation:* do not port it — it removes a scroll affordance and is an accessibility regression. Blocks R15.
- **D11 — CV print view.** Does `styles/print-experiences.css` get restyled to the new typography, or left as-is? *Recommendation:* restyle it — a printed CV in Roboto Mono while the site is Geist would be an obvious seam. Blocks R10, R17.
- **D12 — Content reconciliation.** Independent of the design: the newest role is Feb 2026 – Present while every footer still says © 2025; Publidesign (2015–2016) overlaps DuckMa (Oct 2013–2014) and TargatoBS (2012–2016) in a way that reads as a non-linear chronology; and the footer/navbar links are generic placeholders (`https://github.com`, `https://linkedin.com`) while in-body links use the real profiles — in the same file. *Recommendation:* reconcile the dates against the real CV and the real profile URLs in one pass, separately from the visual work. Blocks R07, R10. See [Export inconsistencies](#export-inconsistencies) for the full list of strings that disagree.
- **D13 — How much perpetual motion?** The spec is explicitly restrained — it rejects "glowing hacker scanlines, exaggerated neon grids, heavy console gimmicks" — and `DESIGN.md` mentions motion only twice, yet the export ships a perpetual full-viewport canvas animation per page, ten infinite `pulse-glow` elements, three shimmer loops, a 5s scanline sweeping the sticky sidebar, and infinite `animate-ping` on status dots, contradicting the spec's own "single-cycle ping". *Recommendation:* take the reveals and refuse the loops — one-shot, scroll-triggered entrance animations (`fadeSlideUp`, `sparkline-draw`, `timelineFill`) plus exactly one live signal (a single-cycle ping on the status dot), with every infinite loop dropped including the canvas backgrounds, which are the export's largest performance cost. If the heading shimmer is wanted as the signature effect, keep it on the hero `<h1>` alone. Blocks R19, R16.

## Export inconsistencies

Strings and behaviours that disagree *within* the export, listed so they are not carried into the implementation by accident. Several of them are worth correcting in Stitch directly: a reference that contradicts itself on the same page is hard to port faithfully, and the port is what the site will be judged against.

### Text

- **The availability string exists in two versions in the same file.** Page 01's navbar badge reads "Available for Staff Roles" — which is what the other four files use — while its own hero still reads "Available for H2 2025", stale by two years. The `<span>` holding it has an emptied `class=""`.
- **Two different LinkedIn URLs, in the same file.** Page 01's hero links to the real `https://www.linkedin.com/in/lucapalomba/`; every navbar CTA and every footer links to the bare `https://linkedin.com`. Every footer also links to the bare `https://github.com`.
- **The numbered nav prefix is almost entirely absent.** The component vocabulary describes `01.`–`04.` mono-prefixed links; in the export the prefix appears on exactly two links in one file (page 02: "01. Who am I", "03. Technologies"). The other fourteen nav links across the export carry no prefix — including page 02's own "Experience" and "Contact".
- **The footer disagrees with itself.** All four footers say "© 2025 Luca Palomba" while the newest role runs to Feb 2026. Pages 02 and 03 both write the footer inline but with different spacing utilities (`py-space-xl` / `space-xl` vs `py-8` / `gap-6`) and a different border alpha (`/10` vs `/30`); pages 01 and 04 are structured differently again.
- **The tenure figure renders wrong.** Page 02 declares `data-suffix="+"` on the "18+" counter, but its count-up function reads only `data-target`, so the number renders as "18" — a content bug caused by the animation code. Page 01's counter does handle prefixes and suffixes, so the two implementations disagree.
- **The contact clock is wrong seven months a year.** It hardcodes `' CET'` in three places and never emits CEST, so it is an hour off throughout European summer time.

### Behaviour

- **Every navigation link in all four files is `href="#"`.** Nothing routes anywhere; the mockups cannot be clicked through.
- **The entrance cascade is dead in all four files** — either declared and never applied (`.reveal-1/2/3` in 01, `.stagger-card` in 02) or applied and never declared (`card-cascade`, `cascade-delay-1`–`5`, `tech-reveal`, `tech-reveal-delay-1`, `cascade-card`). Page 04 has no entrance animation at all, not even on its `<h1>`. See [Motion](#motion).
- **The progress bars never animate.** Every `.progress-bar-fill` ships its width inline (`style="width: 85%"`), which overrides the `width: 0%` its own CSS class declares, so the transition never fires; the script then rewrites the same value after a short delay. Each bar also carries `pulse-glow`, so it glows forever instead of filling once.
- **Page 03 defines `.glass-panel` and `.progress-bar-fill` twice.** The block, pseudo-elements included, is duplicated verbatim and the later definition silently wins, so the spotlight's radius and alpha are not what the first block specifies.
- **The technologies filter does not match its own data.** The "Core Proficiency (≥80%)" bucket selects `data-category="core"`, but PHP (85%) and Advanced Architectures (65%) are tagged `core systems` / `systems` while JavaScript (90%) is tagged plain `core`. The "10 Vectors" count is hardcoded in two places.
- **Page 04's timezone/latency grid is `grid-cols-2` with no breakpoint**, so it never collapses and crushes at 320px. Page 02's telemetry metric rows have the same problem for a different reason — long mono labels in `justify-between` rows with no `flex-wrap` or `truncate`.
- **Mobile navigation does not exist in any of the four files.** See [D8](#decisions-needed).

### Not wrong, but worth a decision

- The copy states invented-looking metrics as fact: Tech Debt Burn 85%, Friday Deploys 0.00, Sprint Velocity +42%, CI Build Health 99.8%, SLO 99.95%, `OPEX_REDUCTION: ~50%`, `LEADERSHIP_MAX: 20 Engineers / 4 Squads`, `v4.18.0`, "18+ Years Active". The values are identical across both export generations, so they are at least stable — but they remain unsourced. See [D2](#decisions-needed).

## What must not be ported

Dead code and inconsistencies in the mockups, recorded so they are not copied as-is:

- `handleFormSubmit()` / `resetContactForm()` in the contact mockup reference `#contact-form`, `#submit-btn` and `#form-success-banner`, none of which exist. There is no contact form in any mockup — and none on the site today.
- `data-path` and `data-active-classes` attributes are dead in every mobile mockup (the desktop nav-highlight script was not carried over), and the nav vocabulary drifts three ways: `who-am-i/experience/technologies/contact`, `overview/architecture/stack/contact`, and nothing at all.
- Bottom-nav labels drift four ways (Overview / Systems / Stack / Contact; Overview / Experience / Stack / Contact; Who am I / Experience / Stack / Contact) and heights drift between `h-16` and `h-20`.
- `font-label-xs` (used in the contact mockup) is not defined in the Tailwind config; `.no-scrollbar` is never defined anywhere.
- The nav-highlight scripts hardcode className strings, overwriting whatever the markup said. Use `aria-current` + a class instead.
- `filterTech()` in the technologies mockup rewrites classNames and hides cards with `display: none`. It has no count update, no empty state, no `aria-pressed`, no URL state and no focus handling.
- The technologies filter buckets do not match the data: "Core Proficiency (≥80%)" uses `data-category="core"`, but PHP (85%) and Advanced Architectures (65%) are tagged `core systems` / `systems`, while JavaScript (90%) is tagged plain `core`. The "10 Vectors" count is hardcoded in two places.
- `copyEmail()` has no failure path, and the live clock has a hardcoded fallback time. In the motion export the failure path is a blocking `alert()` with no `aria-live` announcement, and the clock writes the wrong timezone (above).
- The progress bars in the technologies mockup carry `transition-all duration-700` but ship their widths inline, so nothing ever animates. The site's `js/techProgress.js` already does this correctly with an `IntersectionObserver` — extend that instead.
- The global `::-webkit-scrollbar { display: none }`, `overscroll-behavior: none` and `width: 100vw` resets.
- **The perpetual-motion layer as a whole**: both full-viewport canvas animations, the ten infinite `pulse-glow` elements, `shimmerLoop` / `subtlePulse` / `techGradientShimmer`, the sweeping `scanlineGlow` and the infinite Tailwind `animate-ping`/`animate-pulse`. See [D13](#decisions-needed) and [Motion](#motion).
- **Unthrottled pointer handlers.** Page 01 binds a `mousemove` listener per card that calls `getBoundingClientRect()` and writes a transform on every event; page 03 translates a 600×600 element with `blur(120px)` on every window `mousemove` and calls `getBoundingClientRect()` again inside the spotlight handler. None is rAF-coalesced, and on a high-polling-rate mouse these fire well above frame rate. If a cursor effect survives D13 it must be a single `pointermove` listener, throttled to a frame.
- **Canvas without DPR scaling or gating.** Both canvases size their backing store to CSS pixels, so they render soft on HiDPI, and neither pauses while the tab is hidden. Page 02 sets and resets `ctx.shadowBlur` for each of up to 85 particles every frame and runs an O(n²) proximity pass (~3,570 `Math.hypot` calls per frame); page 01 re-strokes ~29 polylines with a `Math.sqrt` per point and allocates a fresh `createRadialGradient` every frame. Both are per-frame constant rather than delta-timed, so they run about twice as fast on a 120Hz display. These are the export's largest performance costs and the main reason the canvas backgrounds do not survive R16.
- **`will-change: transform` left on permanently** for all six `.tilt-card` elements in page 01 — never removed after `mouseleave`, so six compositor layers stay promoted for the life of the page.
- **Animating layout and paint properties**: `eqBar` animates `height`, and `transition: all` sits on ~18 elements that also carry `backdrop-blur`, so each hover animates a `box-shadow` through a blurred backdrop.
- **`transform-box` missing on `.animate-bar`.** For SVG the initial `transform-box` is `view-box`, so `transform-origin: left` resolves to the viewBox's left edge rather than each rect's own — the timeline bars 2–4 slide in from x=0 instead of growing from their own start.

## Subtasks

Each subtask is intended to become its own PR against `main`. Acceptance criteria assume the repo's existing gates: `bundle exec jekyll build`, `bundle exec htmlproofer ./_site --disable-external`, `npm run lint:md`, `node scripts/check-i18n.js`, Lighthouse ≥ 0.90 × 4.

### Phase 0 — Foundations (blocks everything else)

- [ ] **R01 — Design tokens as CSS custom properties** *([D1](#decisions-needed))* — Add a `styles/tokens.css` loaded before `main.css` defining surfaces, borders, text tiers, accents, spacing, radii and the type scale as custom properties; keep the old `--accent-color` / `--bg-color` names as deprecated aliases so pages can migrate one at a time. Canonical values come from the export's token block. *Done when:* the token file exists, `:root` in `main.css` no longer owns colour, and the site renders unchanged.
- [ ] **R02 — Self-host Geist and JetBrains Mono** — Add woff2 files (Latin + Latin-Extended subsets, weights 400/500/600 for Geist and 400/500 for JetBrains Mono) plus their `OFL.txt` licences under `fonts/`; rewrite `styles/fonts.css`; update the preload in `_includes/head.html` (it currently preloads `RobotoMono-Variable.woff2`); define `--font-ui` and `--font-mono`; remove the Roboto Mono files. *Done when:* `grep -r "Roboto Mono"` finds nothing, the Lighthouse font/LCP budget is still met, and both families render with `font-display: swap`.
- [ ] **R03 — Inline SVG icon sprite** — Inventory the Material Symbols glyphs the mockups use (~28: `description`, `arrow_outward`, `terminal`, `memory`, `commit`, `groups`, `auto_fix_high`, `smart_toy`, `data_object`, `sync_alt`, `layers`, `dns`, `account_tree`, `hub`, `cloud`, `model_training`, `query_stats`, `tune`, `alternate_email`, `done`, `menu`, …), draw or source equivalents as inline SVG, and expose them through a Jekyll include (`{% include icon.html name="terminal" %}`) that renders `<svg aria-hidden="true" focusable="false">` sized from `currentColor`. *Done when:* no icon font is loaded and the sprite covers every icon in the design.
- [ ] **R04 — Layout and component primitives** — Replace the 900px `.container` with the 1200px container and the responsive 12/8/4-column grid; add `.section-header` (mono `NN.N //` kicker + headline), `.card`, `.chip`, `.badge`, `.stat-tile`, `.kv-row`, `.btn` (primary/secondary/ghost), `.ping-dot`, `.progress` and `.sparkline` as plain CSS classes matching the spec. *Done when:* every primitive exists with a documented class name and is used by at least one page.

### Phase 1 — Shell

- [ ] **R05 — Navbar** *([D3](#decisions-needed))* — Rework `_includes/navbar.html` and its CSS to the 64px translucent blurred header with the `<LP />` brand, the availability badge with ping dot, the `01.`–`04.` mono-prefixed links with the active pill, the Curriculum CTA and the avatar, keeping the skip-link, `aria-current`, and visible focus. *Done when:* desktop nav matches the design and keyboard focus is visible on every control.
- [ ] **R06 — Mobile navigation** *([D7](#decisions-needed), [D8](#decisions-needed))* — Implement the decided mobile pattern (recommended: fixed bottom tab bar, `h-16`, safe-area insets, four tabs, `aria-current`, one label source in `en.json`/`it.json`) and remove the superseded mechanism (drawer markup, `js/hamburger.js`, its styles, and the `hide_nav_scripts` plumbing if it becomes unused). *Done when:* mobile navigation works with keyboard and screen reader, the body scroll lock and focus handling are correct or gone, and no dead menu markup remains.
- [ ] **R07 — Footer** *([D12](#decisions-needed))* — Rebuild `_includes/footer.html` to the design's provenance line plus GitHub/LinkedIn links and copyright, using the **real** profile URLs and a copyright year that cannot go stale. *Done when:* no placeholder URL remains and the footer passes contrast.
- [ ] **R08 — Chrome effects audit** *([D4](#decisions-needed)–[D6](#decisions-needed))* — Apply the decisions on particles.js, the transition overlay and the typewriter/sound, and align `theme-color`, `manifest.webmanifest`'s `theme_color` / `background_color` (currently `#6e48aa` / `#0a0a0f`) and the favicon treatment with the new canvas. Delete the CSS and JS of whatever is dropped. *Done when:* no removed feature leaves dead files, and reduced-motion still disables what remains animated.

### Phase 2 — Pages

- [ ] **R09 — Home (Who am I)** *([D2](#decisions-needed), [D6](#decisions-needed), [D13](#decisions-needed))* — Hero (meta badges, display ladder, CTA row), the telemetry sidebar (4 stat tiles + sparkline SVG), the 3-up bento pillars, the `architecture_charter.manifest` ledger, the philosophy block and the bottom CTA band. Do not port the mockup's full-viewport animated grid canvas (D13). Note the mockup defines `display-mobile` (2.25rem) and `headline-lg-mobile` (1.75rem) but never applies them, so its `<h1>` stays at 56px on a 360px phone — the port must actually step the display type down, as page 02's mockup does with `md:text-[3.5rem]`. *Done when:* the page matches the desktop mockup at 1200px, the display type steps down correctly at 375px, and every string is keyed in both locales.
- [ ] **R10 — Experience** *([D2](#decisions-needed), [D7](#decisions-needed), [D11](#decisions-needed), [D12](#decisions-needed), [D13](#decisions-needed))* — 7 role cards with mono date ranges, `@ Company` accent, arrow bullets, key-project callouts with the 2px left border, chip rows; the sticky telemetry sidebar with the SVG career timeline and metric rows; the prev/next progression strip. Keep the existing `experiences.jobs` i18n rendering, the print button and the print stylesheet (restyled per D11). Do not port the particle-constellation canvas, the sweeping `scanlineGlow` on the sticky sidebar, or the 5s infinite loop they imply (D13); do fix the timeline's `transform-box` so the bars grow from their own origin, and make the metric rows wrap or truncate rather than crush at 320px. *Done when:* dynamic rendering still works in EN and IT, the print preview is a usable CV, and the sidebar degrades to a stacked card on mobile.
- [ ] **R11 — Technologies** *([D2](#decisions-needed), [D13](#decisions-needed))* — 10-card matrix with domain tag, title, percentage, semantic-tier progress bar and footer strip; the filter bar; the segmented distribution spectrum with legend; the "Next Chapter" CTA. Extend `js/techProgress.js` for the bars and write a proper filter (count update, empty state, `aria-pressed`, focus handling) rather than porting `filterTech()`. Reconcile the categories so a card's bucket matches its score. Note the mockup's bars carry `pulse-glow` — an infinite animation on ten elements — which D13 drops in favour of a one-shot fill. *Done when:* filtering works with keyboard and announces results, bar widths animate in on scroll exactly once and are instant under reduced motion, and the bar colours encode the score tier.
- [ ] **R12 — Contact** *([D12](#decisions-needed))* — Primary Dispatch card (address, `mailto:`, copy button with an error path and `aria-live` confirmation), the timezone/latency tiles, the network profile rows with inline SVG brand marks, the placement strip and the provenance band; refresh the page's JSON-LD. Two export defects to fix rather than port: the clock hardcodes `' CET'` and never emits CEST, so it is an hour off for seven months of the year — render it from `Intl.DateTimeFormat` with a real timezone, or drop the clock; and the copy button's failure path is a blocking `alert()`. The timezone/latency row is `grid-cols-2` with no breakpoint in the mockup and must collapse. *Done when:* copy works with a visible and announced success state, failure is handled without a blocking dialog, the timezone is correct year-round or absent, and no hardcoded fallback time is reachable.
- [ ] **R13 — 404** *([D9](#decisions-needed))* — Implement the `simplified` variant: `ERR_ROUTE_NULL // 404` badge, `404. Page Not Found`, the two CTAs and the quick-jump link row, with full chrome. Reconcile `hide_nav_links` / `hide_nav_scripts` in `404.html` and the `not-found-page` branch in `_layouts/default.html`, which currently suppress navigation and the hint. *Done when:* the page renders at 375px and 1200px, and the layout's special cases for it are either justified in a comment or removed.

### Phase 3 — Cross-cutting

- [ ] **R14 — i18n for the new content** — Add every new string (pillars, principles, telemetry labels, metric rows, spectrum legend, statuses, CTAs, alt text) to both `translations/en.json` and `translations/it.json`, and extend `js/i18n.js` to render the new repeating structures the way it already renders `experiences.jobs`. *Done when:* `node scripts/check-i18n.js` passes, no raw key is visible in either language, and no existing key was renamed.
- [ ] **R15 — Accessibility and motion** *([D10](#decisions-needed))* — Add the spec's focus ring (2px offset cyan) to every interactive element; guard the ping, pulse and scroll animations behind `prefers-reduced-motion` (the export has none in any file, so R19 owns this); audit contrast (note `#4b5563` muted text on `#111319` is roughly 3.4:1 and fails AA for body copy — use `--outline` `#869397` or lighter); check landmark/heading order; mark decorative SVGs `aria-hidden`; do not ship the hidden scrollbar. *Done when:* axe/Lighthouse accessibility stays ≥ 0.90, keyboard-only traversal of all five pages is complete, and a screen-reader pass finds no unlabelled control.
- [ ] **R16 — Performance budget** — Measure after the visual work: font payload and preload list, LCP element per page, total CSS/JS weight, and the effect of any retained effect script. Adjust subsets, preloads and the `jekyll-minifier` config as needed. The D13 decision removes the export's two canvas animations, which are its largest cost; if any cursor-reactive effect survives it must be rAF-coalesced and single-listener. *Done when:* Lighthouse ≥ 0.90 on all four categories, mobile and desktop, on every page in CI.
- [ ] **R17 — Documentation and metadata** — Update `AGENTS.md`'s "Design system" line (it still documents the violet / Roboto Mono theme) and its project map for the new `docs/` and `styles/` layout; update `README.md`, `_config.yml`'s description, the `theme-color` meta and the manifest. *Done when:* no tracked doc describes the old theme, and `npm run lint:md` passes.
- [ ] **R18 — UAT and visual verification** — Browser pass over all five pages plus 404, desktop and mobile widths, EN and IT, with JS disabled, with `prefers-reduced-motion: reduce`, keyboard-only, and the print preview of the experiences page; capture before/after screenshots; confirm `htmlproofer` is clean. *Done when:* Luca has walked the pages in the browser and signed off — per the repo's standing validation workflow, nothing merges before that.
- [ ] **R19 — Motion layer** *([D13](#decisions-needed))* — Author the motion system the reference does not provide. Name the durations and easings as tokens (`--duration-fast/base/slow`, `--ease-expo-out`) instead of the export's per-file magic numbers, and implement the reveal primitives it intended but never wired up: a `fadeSlideUp` entrance for section headers and cards with a stagger, `sparkline-draw` on the telemetry line, `timelineFill` on the career timeline — with `transform-box: fill-box` so each bar grows from its own left edge — and a single-cycle ping on the status dot. Trigger every entrance through `IntersectionObserver`, reusing the pattern already in `js/techProgress.js` (`threshold: 0.1`, `unobserve` after the first trigger), so nothing runs off-screen or before it is seen. Do not port the infinite loops or either canvas background (D13). *Done when:* the motion vocabulary lives in one place rather than once per page, no animation runs before it is visible, nothing loops forever except the status ping, and every animation is instant under `prefers-reduced-motion: reduce`.

## Suggested sequencing

R01–R04 are genuine prerequisites: every later subtask consumes tokens, fonts, icons and primitives. Within Phase 0 they can go in parallel except that R02 and R03 each touch `styles/fonts.css` / `_includes/head.html`, so they should land in series.

After Phase 0, the four pages (R09–R13) are independent of each other and can be done in any order; the shell (R05–R08) should land first so pages are built on the final chrome. Phase 3 subtasks pair with the page they belong to where possible — R14 with each page as it lands, R15 with the shell — and R16/R17/R18 are closing work.

**R19 is the exception**: it belongs at the end of Phase 0, not in Phase 3 with the other cross-cutting work, because R09–R12 all consume its primitives and would otherwise each invent their own. It needs D13 answered and the tokens from R01 in place, and it is the one subtask whose input is *missing* from the design rather than merely inconsistent — the reference has no motion system to port, only prototypes to read intent from.

One suggested first slice, small enough to be reviewed on its own: **R01 + R02 + R03 + R04**, which produces no visible change but unblocks everything else and proves the font and Lighthouse budgets. **R19** can follow as a second small slice, once D13 is answered, and it is worth landing before any page work so the reveals are shared rather than duplicated four times.

## Interaction with open work

- **PR #68 (`graphical-review`, draft)** — a WIP graphical refactor using the Tailwind CDN and a "kinetic" design. Stitch's Obsidian Precision supersedes it. Recommend closing it, or explicitly declaring it abandoned, before R01 starts, so the repo has one visual direction.
- **PR #127 (`feat/issue-82-server-side-i18n`)** — server-side i18n for SEO. It rewrites how `data-i18n` content is emitted, which is exactly the surface R14 extends. Land it before R09–R13, or rebase those onto it; otherwise the two collide in `js/i18n.js` and every page's markup.
- **PR #125 (`feat/issue-88-pwa-service-worker`)** — touches `manifest.webmanifest` (R08) and caching. Low overlap, but whichever lands second must reconcile the manifest colours.
- **Open issues #88 and #82** cover the same ground as the two PRs above; they are not duplicated by this document.

## Out of scope

- Rewriting the site's copy beyond reconciling it (D2, D12).
- New pages, a contact form, analytics or a backend.
- The CV PDF itself — only the printed view of the experiences page is in scope.
- Migrating the site off Jekyll, or introducing a CSS framework or build step.
