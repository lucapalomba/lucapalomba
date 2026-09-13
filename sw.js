/**
 * sw.js — service worker for the portfolio PWA.
 *
 * The manifest declares `display: standalone`, but Chrome only offers the
 * install prompt for a site that has a service worker with a fetch handler,
 * so this file is what makes the site actually installable. Offline support
 * is the second half of issue #88: the shell is precached, everything else is
 * cached on first use.
 *
 * Everything here uses **relative URLs**, which resolve against this script's
 * own URL. That is what lets one file work with `baseurl: /lucapalomba` in
 * production and with `baseurl: ""` in the Lighthouse build and locally,
 * without any Liquid in the file.
 *
 * The cache version comes from the `?v=` the registration adds (see
 * `_includes/scripts.html`), so every deploy invalidates the previous cache
 * automatically — there is no constant to remember to bump. A service worker
 * whose script URL changes is a new registration, so `install` runs again and
 * `activate` clears the previous version.
 *
 * Only browsers that support service workers ever fetch this file, so modern
 * syntax is safe. It is listed in `jekyll-minifier.exclude` anyway, to keep
 * the shipped file identical to this source.
 */

const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE_NAME = 'lucapalomba-' + VERSION;

// The shell: every page in both languages, the stylesheets and scripts they
// need, and the self-hosted fonts that `styles/fonts.css` asks for first and
// `_includes/head.html` preloads. Deliberately NOT the icons (~200 KB each) or
// the typewriter sounds (~2 mp3): those are runtime-cached on first use instead
// of costing every visitor a download before they have asked for anything.
//
// There is no `translations/*.json` entry and no `js/i18n.js`: since issue #82
// the copy is rendered by Jekyll from `_data/translations/` at build time, so
// those two were only ever fetched by the client-side i18n layer that is gone.
// The Italian pages take their place — they are real files now, and each one is
// the entry point to that language offline.
const PRECACHE_URLS = [
  './',
  './index.html',
  './experiences.html',
  './technologies.html',
  './contact.html',
  './it/index.html',
  './it/experiences.html',
  './it/technologies.html',
  './it/contact.html',
  './404.html',
  './manifest.webmanifest',
  './styles/fonts.css',
  './styles/tokens.css',
  './styles/transitions.css',
  './styles/main.css',
  './styles/mobile.css',
  './styles/mobile-small.css',
  './styles/reduced-motion.css',
  './styles/print-experiences.css',
  './js/langPref.js',
  './js/main.js',
  './js/transitions.js',
  './js/navigation.js',
  './js/hamburger.js',
  './js/backToTop.js',
  './js/titleAnimation.js',
  './js/techProgress.js',
  './js/soundMute.js',
  './js/particles.min.js',
  './fonts/Geist/Geist-Regular.woff2',
  './fonts/Geist/Geist-Medium.woff2',
  './fonts/Geist/Geist-SemiBold.woff2',
  './fonts/JetBrains_Mono/JetBrainsMono-Regular.woff2',
  './fonts/JetBrains_Mono/JetBrainsMono-Medium.woff2'
];

// Served for a navigation that is neither cached nor reachable. Every page of
// the site is in the precache above, so this only catches URLs that do not
// exist at all — there is no per-language variant to pick, and the English home
// is the one page that reaches everything else once the visitor is back online.
const OFFLINE_FALLBACK = './index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // One entry per promise rather than cache.addAll(): addAll is atomic, so
      // a single missing or renamed file would leave the visitor with no
      // offline shell at all. A skipped entry is logged and the rest install.
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((error) => {
            console.warn('[sw] precache skipped', url, error.message);
          })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('lucapalomba-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Never touch anything that is not a plain same-origin GET: the particles
  // CDN is cross-origin (its response is opaque and must not be cached), and
  // caching a POST would be wrong.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleAsset(request));
});

// Network-first: a visitor who is online always gets the deployed HTML, and
// the copy in the cache is refreshed as a side effect. Offline, the last
// cached copy of that exact URL is served.
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match(OFFLINE_FALLBACK);
    if (fallback) return fallback;
    throw error;
  }
}

// Cache-first: the shell is already precached, and anything else same-origin
// (icons, sounds) is fetched once and then served from the cache.
async function handleAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
