#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook — markdownlint gate.
 *
 * Lints the Markdown file that was just written or edited.
 *
 * `PostToolUse` cannot block a tool call (the write has already happened), so
 * this hook exits 2 to surface the lint errors to Claude as feedback, to be
 * fixed in the same turn. The hard, non-bypassable gate is the required
 * `markdownlint` status check on `main` — see .github/workflows/markdownlint.yml.
 *
 * Written in Node rather than the documented jq/shell pattern because this repo
 * is developed on Windows, where jq is not installed. Node 24 is always present.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CLI_RELATIVE = path.join('node_modules', 'markdownlint-cli2', 'markdownlint-cli2-bin.mjs');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

async function main() {
  let event;
  try {
    event = JSON.parse(await readStdin());
  } catch {
    process.exit(0); // Never break the session over an unparseable event.
  }

  const filePath = event?.tool_input?.file_path;
  if (typeof filePath !== 'string' || !/\.(md|markdown)$/i.test(filePath)) process.exit(0);
  if (!existsSync(filePath)) process.exit(0);

  // `cwd` follows Claude into worktrees, which is exactly what we want: the
  // lint must read both the config and the file from the checkout being edited.
  // (`CLAUDE_PROJECT_DIR` stays pinned to the main checkout even inside one.)
  const cwd = typeof event?.cwd === 'string' && existsSync(event.cwd) ? event.cwd : process.cwd();

  const candidates = [
    path.join(cwd, CLI_RELATIVE),
    process.env.CLAUDE_PROJECT_DIR
      ? path.join(process.env.CLAUDE_PROJECT_DIR, CLI_RELATIVE)
      : null,
  ].filter(Boolean);
  const cli = candidates.find((candidate) => existsSync(candidate));

  if (!cli) {
    console.error(
      'The markdownlint gate is not operational: markdownlint-cli2 is not installed.\n' +
        'Run `npm ci` in the repository root to enable it.',
    );
    process.exit(2);
  }

  // Pass a path relative to cwd, with forward slashes: that is how the config's
  // ignore globs (e.g. `.claude/worktrees/**`) are written.
  const relative = (path.relative(cwd, filePath) || filePath).split(path.sep).join('/');

  try {
    // `--no-globs` is essential: with the config's `globs` in play, passing a
    // file as an argument lints the union of the two, i.e. the whole repo — so
    // unrelated failures would be reported against the file just edited.
    execFileSync(process.execPath, [cli, '--no-globs', relative], {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    process.exit(0);
  } catch (error) {
    const report = [error.stdout, error.stderr].filter(Boolean).join('').trim();
    console.error(
      `markdownlint found problems in ${relative}. Fix them before finishing; ` +
        `re-check the whole repo with \`npm run lint:md\`.\n\n${report}`,
    );
    process.exit(2);
  }
}

main().catch(() => process.exit(0));
