# AGENTS.md

Linee guida e mappa del progetto per gli agent AI che lavorano su questo sito.
Portfolio personale di Luca Palomba — static site generato con Jekyll, deployato su GitHub Pages.

## Stack

- **Jekyll** (gem `github-pages`) come static site generator; templating Liquid.
- **Tailwind CSS** caricato via CDN con configurazione inline in `_includes/head.html` (palette, spacing, font, fontSize estesi). Nessun build step Tailwind: le classi sono generate a runtime nel browser.
- **JavaScript vanilla** modulare (moduli ES-ish, caricati via `<script defer>`), niente bundler.
- **i18n custom** (`js/i18n.js`) basato su attributi `data-i18n` + file JSON in `translations/`.
- **Deploy**: GitHub Actions → GitHub Pages. Lighthouse CI + htmlproofer nel workflow.

## Comandi locali

L'ambiente ha Ruby 3.4 + Bundler, ma c'è un conflitto `public_suffix` (7 installata, Gemfile ne richiede 5). **Usa sempre `bundle exec`** per i comandi Jekyll.

- Build produzione: `bundle exec jekyll build`
- Dev server locale: `bundle exec jekyll serve --config _config.yml,_config_local.yml --livereload`
  - `_config_local.yml` azzera `baseurl` (in produzione è `/lucapalomba`) così i link funzionano su `http://127.0.0.1:4000/`.
- Check link: `bundle exec htmlproofer ./_site --disable-external`

## Convenzioni chiave

- **Config duale**: `_config.yml` (prod, `baseurl: /lucapalomba`) + `_config_local.yml` (locale, `baseurl: ""`). I link nel markup sono relativi (`index.html`, `experiences.html`) e vengono risolti da Jekyll via `relative_url`.
- **i18n**: ogni stringa UI ha `data-i18n="chiave.puntata"` (es. `nav.whoami`, `index.hero.title`); le traduzioni vivono in `translations/en.json` e `it.json`. Per gli `aria-label` si usa `data-i18n-aria`. Il linguaggio è scelto da `localStorage('preferredLanguage')` poi da `navigator.language`, e salvato su switch manuale.
- **Front matter delle pagine**: supporta `page_scripts` (lista di path JS aggiuntivi caricati in fondo) e `hide_nav_scripts` (disabilita `navigation.js`/`hamburger.js`). `body_class` marca la pagina (es. `experiences-page`, `technologies-page`, `contact-page`) — usato da `i18n.js` per i meta tag e da `techProgress.js` per attivare le animazioni.
- **Design system**: tema "brutalist/industriale" — border-radius 0, ombre hard (`shadow-[8px_8px_0px_...]`), skew `-6deg` su titoli, font Montserrat (display) + JetBrains Mono (label/mono) + Inter (body). Palette dark con accenti `primary-container` (#ff544e) e `secondary` (#41e4c0).
- **Commit**: stile conventional commits (`feat:`, `fix:`). Lavorare su branch separati / PR; il deploy avviene solo da `main`.

## Mappa del progetto

### Config & build
- `_config.yml` — config Jekyll di produzione (titolo, baseurl, plugins, jekyll-minifier, SEO/social).
- `_config_local.yml` — override per dev locale (baseurl vuoto).
- `Gemfile` / `Gemfile.lock` — dipendenze Ruby (`github-pages` + plugin jekyll). Usa `bundle exec`.
- `lighthouserc.json` — config Lighthouse CI (usato dal workflow).
- `manifest.webmanifest` — PWA manifest.
- `.github/workflows/jekyll.yml` — CI: build Jekyll → htmlproofer → build per Lighthouse (mobile+desktop) → upload artifact → deploy su Pages (solo da `main`).

### Layout & includes (Jekyll)
- `_layouts/default.html` — layout base: html `dark`, skip-link, overlay transizione, navbar, `{{ content }}`, footer, scripts. Tutte le pagine usano `layout: default`.
- `_includes/head.html` — `<head>`: meta, favicon (da GitHub avatar), CDN Tailwind + config inline (palette/font/spacing), Google Fonts (Montserrat/JetBrains Mono/Inter/Material Symbols), SEO/OG/Twitter, JSON-LD `Person`, stylesheet (`transitions`, `main`, `reduced-motion`, `print-experiences`).
- `_includes/navbar.html` — navbar sticky con logo, link desktop (stato attivo via confronto `page.url`), selettore lingua EN/IT (desktop+mobile), drawer mobile, CTA "GET_IN_TOUCH". Contiene lo script `updateLangToggleUI` e la logica toggle del drawer.
- `_includes/footer.html` — footer: copyright, link GitHub/LinkedIn, indicatore "STATUS: NOMINAL".
- `_includes/scripts.html` — carica i JS core (`i18n`, `main`, `transitions`) + condizionali (`navigation`, `hamburger` salvo `hide_nav_scripts`) + `page_scripts` + `backToTop`.
- `_includes/transition-overlay.html` — markup dell'overlay a tutto schermo per le transizioni fra pagine (color-fill + smoke).
- `_includes/navigation-hint.html` — div placeholder per l'hint "usa ← → / swipe" mostrato da `navigation.js`.

### Pagine
- `index.html` — home: hero (nome + titolo animato + CTA), sezione "Selected Deployments" (3 progetti: Openware 3.0, Rad Engine, Baucoin), about con foto, striscia marquee. Script inline per micro-interazione mouse-shadow e keyframes marquee. Carica `titleAnimation.js` e `backToTop.js` via `page_scripts`.
- `experiences.html` — timeline esperienze lavorative. Struttura `.timeline` / `.timeline-item` con `.date`, `h2`, `.job-description`, `.key-project`, `.tech-stack`. Popolata dinamicamente da `i18n.js` (array `experiences.jobs`). Ha bottone stampa + CSS printabile.
- `technologies.html` — grid tecnologie con barre di avanzamento (`.tech-progress-fill` con `data-progress`) animate da `techProgress.js`. `body_class: technologies-page`.
- `contact.html` — pagina contatti con form/links. `body_class: contact-page`.
- `404.html` — pagina di errore personalizzata.

### JavaScript (`js/`)
- `i18n.js` — classe `I18n` (esposta come `window.i18n`): detection lingua (localStorage → browser), fetch `translations/<lang>.json`, traduzione elementi `data-i18n` / `data-i18n-aria`, aggiornamento meta tag (title/description per pagina), render della timeline esperienze, easter egg in console, `switchLanguage()` + `getCurrentLanguage()`.
- `main.js` — init post-DOMContentLoaded: marca l'overlay di transizione come `finished` dopo l'entry (le animazioni vivono in CSS).
- `transitions.js` — classe `PageTransition`: intercetta i click su link interni (esclusi `target="_blank"` e skip-link), mostra l'overlay, attende ~660ms poi naviga. Animazione exit gestita via classe `active`.
- `navigation.js` — navigazione circolare tra le 4 pagine con frecce ← → (keyboard) e swipe (touch, soglia 100px + guard orizzontale). Mostra e fa sparire l'hint di navigazione dopo 5s.
- `hamburger.js` — classe `HamburgerMenu`: toggle drawer mobile, chiusura su link interno / Escape / click esterno, blocca scroll body quando aperto.
- `backToTop.js` — crea il pulsante "Go to top", lo mostra dopo 300px di scroll, scroll smooth, integra traduzione `backToTop`.
- `titleAnimation.js` — classe `TitleAnimator`: effetto macchina da scrivere sul `.hero-title` con 3 step multilingua, evidenziazione parole, suoni tastiera (pool di 3 audio per tipo da `sounds/`), riavvio al click. Rimuove `data-i18n` per non essere sovrascritto.
- `techProgress.js` — anima la larghezza delle `.tech-progress-fill` al `data-progress`% dopo il load, solo su `technologies-page`.

### Stili (`styles/`)
- `main.css` — stili globali principali (layout componenti, timeline, keyframes design "kinetic", back-to-top, navigation-hint, ecc.).
- `transitions.css` — animazioni dell'overlay di transizione (color-fill, smoke, fade body in entrata).
- `reduced-motion.css` — caricato solo con `prefers-reduced-motion: reduce`; disabilita animazioni/transizioni.
- `print-experiences.css` — stylesheet `media="print"` per la versione stampabile del CV (experiences).
- `mobile.css` / `mobile-small.css` — override responsive per schermi piccoli.
- `fonts.css` — definizioni/override font.

### Traduzioni (`translations/`)
- `en.json` — dizionario inglese (nav, hero, experiences.jobs[], technologies, contact, title/description per pagina, consoleEasterEgg, backToTop).
- `it.json` — dizionario italiano, stessa struttura.

### Risorse
- `images/` — immagini del sito.
- `fonts/` — font locali (se presenti).
- `sounds/` — clip audio per `titleAnimation.js` (`keyboard-click.mp3`, `keyboard-click-delete.mp3`).
- `_site/` — output di build (generato, non committare modifiche manuali).

## Note / insidie

- **`bundle exec` obbligatorio** per evitare il conflitto `public_suffix` 7 vs 5.
- Aggiungere una nuova pagina: crea il `.html` con front matter `layout: default` + `body_class` + voce in `navigation.js` (array `pages`) + link in `navbar.html` + traduzioni in entrambi i `translations/*.json` + meta key `${page}.${titleKey}`/`description`.
- Le stringhe nuove vanno aggiunte in **entrambi** `en.json` e `it.json`, altrimenti `i18n.js` mostra la chiave grezza.
- Tailwind è CDN/runtime: le classi arbitrarie tipo `shadow-[8px_8px_0px_#ff544e]` funzionano, ma non c'è purging — nessun build step CSS da lanciare.
- 14 file con modifiche non committate al momento della stesura (refactor corposo su head, navbar, contact, experiences, technologies, main.js, transitions.css). Verificare `git diff` prima di lavorare.