#!/usr/bin/env node
/**
 * check-css-minify.js — guards the built CSS against the minifier's calc() bug.
 *
 * jekyll-minifier compresses stylesheets through cssminify2, whose calc()
 * handling normalises the spacing around every operator (cssmin.rb:145): its
 * gsub wraps each of `+ - * /` inside calc() in spaces — and that includes the
 * hyphens of a custom-property name. A source declaration such as
 *
 *     padding-top: calc(var(--nav-height) + var(--space-xl));
 *
 * ships as `calc(var( -  - nav - height)+var(--space-xl))`. `var( -  - …)` is
 * not a valid custom-property reference, so the browser drops the whole
 * declaration at parse time: no error anywhere, only a silently missing rule
 * (it put every page title under the fixed navbar — issue #157).
 *
 * The only reliable workaround is to keep var() out of calc() in styles/:
 * split the offset across two declarations, or precompute a token. This script
 * scans a production build for the corrupted pattern so a future
 * `calc(var(--x) + var(--y))` fails CI instead of shipping.
 *
 * Usage:  node scripts/check-css-minify.js [buildDir]   (default: _site)
 * Exits 1 on failure. Zero dependencies, like scripts/check-i18n.js.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.resolve(ROOT, process.argv[2] || '_site');

// `var(` followed by whitespace and a hyphen is never valid CSS: a custom
// property name starts immediately after the opening parenthesis.
const CORRUPTED = /var\(\s+-/g;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`check-css-minify: build directory not found: ${BUILD_DIR}`);
    console.error('Run `jekyll build` (JEKYLL_ENV=production) first.');
    process.exit(1);
  }

  const files = walk(BUILD_DIR, []);
  if (files.length === 0) {
    console.error(`check-css-minify: no CSS found under ${BUILD_DIR}`);
    process.exit(1);
  }

  let failures = 0;
  let checked = 0;

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    checked += 1;

    let match;
    while ((match = CORRUPTED.exec(text)) !== null) {
      const line = lineOf(text, match.index);
      const snippet = text.slice(match.index, match.index + 70).split(/[;}]/)[0];
      console.error(
        `${path.relative(ROOT, file)}:${line}  corrupted custom property: ${snippet}`
      );
      failures += 1;
    }
    CORRUPTED.lastIndex = 0;
  }

  if (failures > 0) {
    console.error('');
    console.error(
      `check-css-minify: ${failures} corrupted declaration(s) in ${checked} stylesheets.`
    );
    console.error(
      'jekyll-minifier/csminify2 mangles every hyphen inside calc(), including'
    );
    console.error(
      'the ones in var(--tokens). Keep var() out of calc() in styles/: split the'
    );
    console.error('offset into two declarations, or add a precomputed token.');
    process.exit(1);
  }

  console.log(`check-css-minify: OK — ${checked} stylesheets, no corrupted var().`);
}

main();
