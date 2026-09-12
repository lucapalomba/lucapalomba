# CLAUDE.md

Claude Code–specific workflow rules for this repository. For the full project map (stack, conventions, i18n, structure), see [AGENTS.md](AGENTS.md).

## Workflow rules

Every Claude Code session working on this repository MUST follow these rules. No exceptions.

### 1. Always work in a worktree

- Every task starts by creating a git worktree under `.claude/worktrees/` (via `EnterWorktree`). Never commit directly on `main`.
- Base new worktrees on `origin/main` (fresh), not on a local branch.
- Do not work, commit, or touch the `main` checkout during regular work.

### 2. Open PRs — never merge locally

- All changes go through a pull request: after the work is done, push the branch and open a PR to `main`.
- Never finish work with local merges or rebases onto `main` (`git merge`, `git rebase main`).

### 3. Merging always happens on GitHub

- If asked to merge a PR, do it through GitHub (e.g. `gh pr merge`), never with local git commands.
- Never use `git push` to fast-forward `main` or otherwise modify `main` directly.
