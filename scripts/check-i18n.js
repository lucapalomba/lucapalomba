#!/usr/bin/env node
/**
 * check-i18n.js — i18n integrity check for the Jekyll portfolio site.
 *
 * The site is rendered server-side from _data/translations/<lang>.json: every
 * layout and include reads strings out of `t` (the dictionary for `page.lang`),
 * and every page declares which language it is in and which page is its
 * counterpart. This script verifies, with zero external dependencies:
 *
 *   1. _data/translations/en.json and it.json are valid JSON.
 *   2. The two locale files share the exact same shape: every leaf path present
 *      in one is present in the other (catches missing keys, renamed keys, and
 *      array-length drift such as experiences.jobs).
 *   3. Every key referenced as `t.<dotted.path>` by a layout, include or page
 *      resolves to a non-null value in BOTH locales. References are read out of
 *      Liquid segments only, and only full paths are used (no aliases), so a
 *      plain regex can extract them.
 *   4. Every page's front matter is complete and consistent: a `lang` that has a
 *      dictionary, an `i18n_key` whose entry has a pageTitle and a description in
 *      every locale, and either a reciprocal `alt_url`/`alt_lang` pair or an
 *      explicit `no_alternate: true`. Reciprocity is what keeps the hreflang
 *      alternates pointing at each other.
 *   5. No `data-i18n` / `data-i18n-aria` attribute survives anywhere: they were
 *      the client-side mechanism this replaced, and a leftover one would now be
 *      silently inert.
 *
 * Exits 1 on failure, printing a readable report. Intended to run in CI
 * (Node 24, no install) via `node scripts/check-i18n.js`.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, '_data', 'translations');
const LOCALES = ['en', 'it'];
const LOCALE_PATHS = LOCALES.map(lang => path.join(DATA_DIR, `${lang}.json`));

// Directories that hold sources to scan for `t.` references and pages.
const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'scripts', 'scratch', 'vendor']);

// Build output, at any name: Jekyll is run with several destinations here
// (`_site` for the deploy build, `_site_lhci` for Lighthouse), and a stale one
// left in the checkout must not be scanned — its minified inline JavaScript
// contains `t.addEventListener(...)`, which reads exactly like a translation
// reference.
function isBuildOutput(name) {
  return name.startsWith('_site');
}

let failures = 0;
const errors = [];

function fail(message) {
  errors.push(message);
  failures++;
}

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    fail(`Invalid JSON in ${path.relative(ROOT, file)}: ${err.message}`);
    return null;
  }
}

/**
 * Collect every leaf path in a value. Objects recurse into keys; arrays of
 * objects recurse into `[i]` indices (so a shorter list of jobs is caught),
 * while arrays of scalars are a leaf on their own — a list of highlighted
 * keywords has as many entries as the language has words, so its length is
 * content, not shape. Leaves are strings, numbers, booleans, or null.
 */
function collectLeafPaths(value, prefix, out) {
  if (value === null || typeof value !== 'object') {
    out.add(prefix);
    return;
  }
  if (Array.isArray(value)) {
    if (!value.some(item => item !== null && typeof item === 'object')) {
      out.add(prefix);
      return;
    }
    value.forEach((item, i) => collectLeafPaths(item, `${prefix}[${i}]`, out));
    return;
  }
  for (const key of Object.keys(value)) {
    collectLeafPaths(value[key], prefix ? `${prefix}.${key}` : key, out);
  }
}

/** Resolve a dotted key path (e.g. "nav.experience") against a locale. */
function resolveKey(locale, key) {
  const parts = key.split('.');
  let value = locale;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }
  return value;
}

function isUsable(value) {
  return value !== undefined && value !== null;
}

/** Walk a directory recursively, yielding file paths, skipping known dirs. */
function* walkFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || isBuildOutput(entry.name)) continue;
      yield* walkFiles(path.join(dir, entry.name));
    } else if (entry.isFile()) {
      yield path.join(dir, entry.name);
    }
  }
}

/** Strip comments so a `t.…` mentioned in prose is not treated as a reference. */
function stripComments(source) {
  const patterns = [
    /\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g,
    /<!--[\s\S]*?-->/g
  ];
  // Repeat to a fixed point rather than once: a single pass removes the
  // outermost match only, so a nested or overlapping construct can leave a
  // stray `<!--` / `{% comment %}` behind and the scan would then read prose as
  // a reference. (CodeQL js/incomplete-multi-character-sanitization.)
  let stripped = source;
  let previous;
  do {
    previous = stripped;
    for (const pattern of patterns) stripped = stripped.replace(pattern, '');
  } while (stripped !== previous);
  return stripped;
}

/** Jekyll's default page permalink: index.html collapses to its directory. */
function pageUrlFor(relPath) {
  const dir = path.dirname(relPath);
  const base = path.basename(relPath);
  const prefix = dir === '.' ? '' : `${dir.split(path.sep).join('/')}/`;
  if (base === 'index.html') return `/${prefix}`;
  return `/${prefix}${base}`;
}

/** Parse the handful of scalar front-matter keys this check cares about. */
function parseFrontMatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const entry = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(line);
    if (!entry) continue;
    let value = entry[2].trim();
    if (value.length > 1 && ((value[0] === '"' && value.endsWith('"')) || (value[0] === "'" && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    fields[entry[1]] = value;
  }
  return fields;
}

function collectReferences() {
  const keys = new Map(); // "lang:key" not needed — validity is locale-independent
  const refRe = /(?:^|[^\w$.])t\.([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/g;
  // `t.<path>` only means something inside Liquid (`{{ t.nav.whoami }}`, or a tag
  // such as `{% assign x = t.index.hero.bio %}`), so only Liquid segments are
  // scanned. Reading the whole file would also match JavaScript in an inline
  // `<script>`, where `t` is just a variable — `t.addEventListener(...)` is not
  // a translation key, and a minified build makes that collision likely.
  const liquidRe = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g;

  for (const file of walkFiles(ROOT)) {
    if (!file.endsWith('.html')) continue;
    const rel = path.relative(ROOT, file).split(path.sep).join('/');

    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    // Leftover client-side attributes are a hard failure.
    const attrRe = /data-i18n(?:-aria)?\s*=/g;
    let attrMatch;
    while ((attrMatch = attrRe.exec(content)) !== null) {
      fail(`${rel}: leftover ${attrMatch[0].slice(0, -1).trim()} attribute — strings are rendered by Jekyll now`);
    }

    for (const segment of stripComments(content).match(liquidRe) || []) {
      let match;
      while ((match = refRe.exec(segment)) !== null) {
        const key = match[1];
        if (!keys.has(key)) keys.set(key, new Set());
        keys.get(key).add(rel);
      }
    }
  }

  return keys;
}

function collectPages() {
  const pages = new Map(); // url -> { rel, fields }
  for (const file of walkFiles(ROOT)) {
    if (!file.endsWith('.html')) continue;
    const rel = path.relative(ROOT, file);
    const top = rel.split(path.sep)[0];
    if (top.startsWith('_')) continue; // _layouts, _includes, _data, …

    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const fields = parseFrontMatter(content);
    if (!fields) continue;
    pages.set(pageUrlFor(rel), { rel: rel.split(path.sep).join('/'), fields });
  }
  return pages;
}

function checkPages(locales, localesByLang) {
  const pages = collectPages();

  for (const [url, { rel, fields }] of pages) {
    const lang = fields.lang;
    if (!lang) {
      fail(`${rel}: missing front-matter "lang"`);
      continue;
    }
    if (!localesByLang.has(lang)) {
      fail(`${rel}: lang "${lang}" has no dictionary in _data/translations/${lang}.json`);
      continue;
    }

    const i18nKey = fields.i18n_key;
    if (!i18nKey) {
      fail(`${rel}: missing front-matter "i18n_key"`);
    } else {
      for (const locale of LOCALES) {
        const entry = locales[locale] && locales[locale][i18nKey];
        if (!isUsable(entry)) {
          fail(`${rel}: i18n_key "${i18nKey}" not found in ${locale}.json`);
          continue;
        }
        if (typeof entry.pageTitle !== 'string' || entry.pageTitle === '') {
          fail(`${rel}: ${locale}.json → "${i18nKey}.pageTitle" is missing (needed for <title>)`);
        }
        if (typeof entry.description !== 'string' || entry.description === '') {
          fail(`${rel}: ${locale}.json → "${i18nKey}.description" is missing (needed for the meta description)`);
        }
      }
    }

    if (fields.no_alternate === 'true') {
      if (fields.alt_url) {
        fail(`${rel}: declares both "alt_url" and "no_alternate" — pick one`);
      }
      continue;
    }

    if (!fields.alt_url || !fields.alt_lang) {
      fail(`${rel}: needs "alt_url" + "alt_lang" (the other language's page) or "no_alternate: true"`);
      continue;
    }

    if (!localesByLang.has(fields.alt_lang)) {
      fail(`${rel}: alt_lang "${fields.alt_lang}" has no dictionary`);
      continue;
    }
    if (fields.alt_lang === lang) {
      fail(`${rel}: alt_lang is the same as lang`);
    }

    const counterpart = pages.get(fields.alt_url);
    if (!counterpart) {
      fail(`${rel}: alt_url "${fields.alt_url}" matches no page in this repository`);
      continue;
    }
    if (counterpart.fields.lang !== fields.alt_lang) {
      fail(`${rel}: alt_url "${fields.alt_url}" is a "${counterpart.fields.lang}" page, but alt_lang is "${fields.alt_lang}"`);
    }
    if (counterpart.fields.alt_url !== url) {
      fail(`${rel}: alt_url "${fields.alt_url}" does not point back — ${counterpart.rel} has alt_url "${counterpart.fields.alt_url}" instead of "${url}"`);
    }
  }

  return pages.size;
}

function main() {
  const locales = {};
  let parsed = true;
  LOCALE_PATHS.forEach((file, i) => {
    const data = readJSON(file);
    if (!data) parsed = false;
    locales[LOCALES[i]] = data;
  });
  if (!parsed) {
    report(0, 0);
    process.exit(1);
  }

  // --- Shape equality between locales ---
  const pathSets = LOCALES.map(lang => {
    const set = new Set();
    collectLeafPaths(locales[lang], '', set);
    return set;
  });
  const [enPaths, itPaths] = pathSets;

  const missingInIt = [...enPaths].filter(p => !itPaths.has(p)).sort();
  const missingInEn = [...itPaths].filter(p => !enPaths.has(p)).sort();
  if (missingInIt.length) {
    fail(`Keys present in en.json but missing in it.json:\n  ${missingInIt.join('\n  ')}`);
  }
  if (missingInEn.length) {
    fail(`Keys present in it.json but missing in en.json:\n  ${missingInEn.join('\n  ')}`);
  }

  // --- og:locale, needed by _includes/head.html via site.data ---
  for (const lang of LOCALES) {
    if (typeof locales[lang].ogLocale !== 'string' || locales[lang].ogLocale === '') {
      fail(`${lang}.json: "ogLocale" must be a non-empty string (used for og:locale)`);
    }
  }

  // --- `t.<path>` references resolve in both locales ---
  const references = collectReferences();
  for (const [key, files] of [...references.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const where = `(${[...files].sort().join(', ')})`;
    for (const lang of LOCALES) {
      if (!isUsable(resolveKey(locales[lang], key))) {
        fail(`t.${key} ${where} not found in ${lang}.json`);
      }
    }
  }

  // --- Page front matter ---
  const localesByLang = new Set(Object.keys(locales));
  const pageCount = checkPages(locales, localesByLang);

  report(references.size, pageCount);
  process.exit(failures ? 1 : 0);
}

function report(refCount, pageCount) {
  if (failures === 0) {
    console.log(`✓ i18n check passed — locales match, ${refCount} reference(s) resolve in ${LOCALES.join(' + ')}, ${pageCount} page(s) paired.`);
    return;
  }
  console.error(`✗ i18n check failed — ${failures} problem(s):\n`);
  console.error(errors.map(e => `  - ${e}`).join('\n\n') + '\n');
}

main();
