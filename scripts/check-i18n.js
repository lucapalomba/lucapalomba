#!/usr/bin/env node
/**
 * check-i18n.js — i18n integrity check for the Jekyll portfolio site.
 *
 * Verifies, with zero external dependencies:
 *   1. translations/en.json and translations/it.json are valid JSON.
 *   2. The two locale files share the exact same shape: every leaf path
 *      present in one is present in the other (catches missing keys,
 *      renamed keys, and array-length drift such as experiences.jobs).
 *   3. Every data-i18n / data-i18n-aria key referenced by any source HTML
 *      file (root pages, _includes, _layouts) resolves to a non-null value
 *      in BOTH locales.
 *
 * Exits 1 on the first failing category, printing a readable report.
 * Intended to run in CI (Node 24, no install) via `node scripts/check-i18n.js`.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EN_PATH = path.join(ROOT, 'translations', 'en.json');
const IT_PATH = path.join(ROOT, 'translations', 'it.json');

// Source .html files live at the repo root and in _includes/ and _layouts/.
// walkHtml(ROOT) recurses into all of them; _site/ (build output) is skipped.
const SKIP_DIRS = new Set(['_site', 'node_modules', '.git', '.github']);

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
 * Collect every leaf path in a value. Objects recurse into keys, arrays
 * recurse into `[i]` indices. Leaves are strings, numbers, booleans, or
 * null. Paths use dot notation for object keys and `[i]` for array indices.
 */
function collectLeafPaths(value, prefix, out) {
  if (value === null || typeof value !== 'object') {
    out.add(prefix);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      out.add(prefix); // empty array treated as a leaf
      return;
    }
    value.forEach((item, i) => collectLeafPaths(item, `${prefix}[${i}]`, out));
    return;
  }
  for (const key of Object.keys(value)) {
    collectLeafPaths(value[key], prefix ? `${prefix}.${key}` : key, out);
  }
}

/** Resolve a dotted key path (e.g. "nav.experiences") against a locale. */
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

/** Walk a directory recursively, yielding .html file paths, skipping dirs. */
function* walkHtml(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walkHtml(path.join(dir, entry.name));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      yield path.join(dir, entry.name);
    }
  }
}

function collectHtmlKeys() {
  const keys = new Map(); // key -> Set of files referencing it
  for (const file of walkHtml(ROOT)) {
    collectFromFile(file, keys);
  }
  return keys;
}

function collectFromFile(file, keys) {
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  const rel = path.relative(ROOT, file);
  const attrRe = /data-i18n(?:-aria)?\s*=\s*"([^"]+)"/g;
  let match;
  while ((match = attrRe.exec(content)) !== null) {
    const key = match[1];
    if (!keys.has(key)) keys.set(key, new Set());
    keys.get(key).add(rel);
  }
}

function main() {
  const en = readJSON(EN_PATH);
  const it = readJSON(IT_PATH);
  if (!en || !it) {
    report();
    process.exit(failures ? 1 : 0);
  }

  // --- Shape equality between locales ---
  const enPaths = new Set();
  const itPaths = new Set();
  collectLeafPaths(en, '', enPaths);
  collectLeafPaths(it, '', itPaths);

  const missingInIt = [...enPaths].filter(p => !itPaths.has(p)).sort();
  const missingInEn = [...itPaths].filter(p => !enPaths.has(p)).sort();
  if (missingInIt.length) {
    fail(`Keys present in en.json but missing in it.json:\n  ${missingInIt.join('\n  ')}`);
  }
  if (missingInEn.length) {
    fail(`Keys present in it.json but missing in en.json:\n  ${missingInEn.join('\n  ')}`);
  }

  // --- HTML-referenced keys resolve in both locales ---
  const htmlKeys = collectHtmlKeys();
  for (const [key, files] of [...htmlKeys.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const enVal = resolveKey(en, key);
    const itVal = resolveKey(it, key);
    const where = `(${[...files].join(', ')})`;
    if (enVal === undefined) {
      fail(`data-i18n key "${key}" ${where} not found in en.json`);
    } else if (enVal === null) {
      fail(`data-i18n key "${key}" ${where} is null in en.json`);
    }
    if (itVal === undefined) {
      fail(`data-i18n key "${key}" ${where} not found in it.json`);
    } else if (itVal === null) {
      fail(`data-i18n key "${key}" ${where} is null in it.json`);
    }
  }

  report(htmlKeys.size);
  process.exit(failures ? 1 : 0);
}

function report(htmlKeyCount) {
  if (failures === 0) {
    console.log(`✓ i18n check passed — locales match, ${htmlKeyCount || 0} HTML key(s) resolve in en + it.`);
    return;
  }
  console.error(`✗ i18n check failed — ${failures} problem(s):\n`);
  console.error(errors.map(e => `  - ${e}`).join('\n\n') + '\n');
}

main();