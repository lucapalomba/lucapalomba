#!/usr/bin/env node
/**
 * Build the printable CV PDFs (issue #153).
 *
 * `window.print()` hands the visitor the browser's own header and footer, which
 * puts the page URL — a link to itself — at the bottom of every sheet. The only
 * way to ship a CV without that chrome is to print it ourselves, with the
 * header/footer flag off, and hand out the resulting file.
 *
 * This script renders the already-built site through headless Chrome:
 *
 *   1. serves `--dir` on localhost (a static server, because the stylesheet
 *      paths are absolute and do not resolve from `file://`),
 *   2. prints each page to `--out` with `--no-pdf-header-footer`,
 *   3. asserts the result has no link annotations (`/URI`, `/Annots`) and is not
 *      an empty shell, so a silent regression cannot ship the old artefact.
 *
 * Zero dependencies: only Node's stdlib and an installed Chrome/Chromium.
 * Chrome 116+ is required for `--no-pdf-header-footer`.
 *
 * Usage:
 *   node scripts/build-cv-pdf.js                # _site_lhci -> _site/cv
 *   node scripts/build-cv-pdf.js --dir _site_lhci --out _site/cv
 */

const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const PAGES = [
  { source: 'experiences.html', out: 'luca-palomba-cv.pdf' },
  { source: 'it/experiences.html', out: 'luca-palomba-cv-it.pdf' },
];

const MIN_BYTES = 50_000;
const CHROME_WAIT_MS = 120_000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

function parseArgs(argv) {
  const args = { dir: '_site_lhci', out: '_site/cv', port: 0 };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--dir') args.dir = argv[++i];
    else if (key === '--out') args.out = argv[++i];
    else if (key === '--port') args.port = Number(argv[++i]);
    else if (key === '--help' || key === '-h') {
      console.log('usage: node scripts/build-cv-pdf.js [--dir _site_lhci] [--out _site/cv] [--port 0]');
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${key}`);
    }
  }
  return args;
}

function findChrome() {
  const explicit = process.env.CHROME_PATH;
  if (explicit) return explicit;

  const candidates = [];
  if (process.platform === 'win32') {
    for (const base of ['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA']) {
      const root = process.env[base];
      if (root) candidates.push(path.join(root, 'Google/Chrome/Application/chrome.exe'));
      if (root) candidates.push(path.join(root, 'Chromium/Application/chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    candidates.push('/Applications/Chromium.app/Contents/MacOS/Chromium');
  } else {
    candidates.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser');
  }
  candidates.push(process.env.CHROME_BIN || '');

  const found = candidates.find((p) => p && fs.existsSync(p));
  if (!found) {
    throw new Error('Chrome/Chromium not found. Set CHROME_PATH to the executable.');
  }
  return found;
}

/** Minimal static server: enough to serve the built site to Chrome. */
function serve(root) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let rel = decodeURIComponent(url.pathname);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = path.join(root, rel);
      if (!file.startsWith(root)) {
        res.writeHead(403).end('forbidden');
        return;
      }
      const body = await fsp.readFile(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function runChrome(chrome, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`chrome timed out after ${CHROME_WAIT_MS / 1000}s`));
    }, CHROME_WAIT_MS);
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`chrome exited with ${code}\n${stderr.trim()}`));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.dir);
  if (!fs.existsSync(root)) {
    throw new Error(`${args.dir} does not exist — build it first (jekyll build --baseurl "" --destination ${args.dir})`);
  }

  const chrome = findChrome();
  const outDir = path.resolve(args.out);
  await fsp.mkdir(outDir, { recursive: true });

  const profile = await fsp.mkdtemp(path.join(os.tmpdir(), 'cv-pdf-'));
  const server = await serve(root);
  const port = server.address().port;
  console.log(`serving ${path.relative(process.cwd(), root) || '.'} on http://127.0.0.1:${port}`);
  console.log(`chrome: ${chrome}`);

  const results = [];
  try {
    for (const page of PAGES) {
      const target = path.join(outDir, page.out);
      await fsp.rm(target, { force: true });
      const url = `http://127.0.0.1:${port}/${page.source}`;
      await runChrome(chrome, [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--hide-scrollbars',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${profile}`,
        '--run-all-compositor-stages-before-draw',
        '--virtual-time-budget=8000',
        // The whole point: no browser header, no browser footer, no page URL.
        '--no-pdf-header-footer',
        `--print-to-pdf=${target}`,
        url,
      ]);
      results.push({ page, target });
    }
  } finally {
    server.close();
    await fsp.rm(profile, { recursive: true, force: true });
  }

  let failed = 0;
  for (const { page, target } of results) {
    if (!fs.existsSync(target)) {
      console.error(`✗ ${page.out}: chrome produced no file`);
      failed += 1;
      continue;
    }
    const buf = await fsp.readFile(target);
    const kb = Math.round(buf.length / 1024);
    const pages = Number((/\/Type\s*\/Pages[\s\S]{0,200}?\/Count\s+(\d+)/.exec(buf.toString('latin1')) || [])[1] || 0);
    const problems = [];
    if (buf.length < MIN_BYTES) problems.push(`suspiciously small (${kb} kB)`);
    if (buf.includes('/URI')) problems.push('contains link annotations (browser chrome leaked back in?)');
    if (buf.includes('/Annots')) problems.push('contains annotations');
    if (!pages) problems.push('page count not found');
    if (problems.length) {
      console.error(`✗ ${page.out}: ${problems.join('; ')}`);
      failed += 1;
    } else {
      console.log(`✓ ${page.out} — ${kb} kB, ${pages} pages, no link annotations`);
    }
  }

  if (failed) throw new Error(`${failed} CV PDF(s) failed verification`);
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
