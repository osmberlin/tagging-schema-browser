# AGENTS.md

Rules for AI agents and contributors working in this repo. Setup and commands are in [README.md](README.md#develop).

## Dependency install

Always install dependencies with the lockfile:

```bash
bun install --frozen-lockfile
```

Do **not** run plain `bun install`. Without the lockfile, Bun can hoist a newer nested `rolldown` under `vite` than the one Vite 8 expects, which breaks dev/build with:

```text
Export named 'viteWasmFallbackPlugin' not found in module 'rolldown/experimental'
```

If Vite fails to start, reinstall cleanly:

```bash
rm -rf node_modules && bun install --frozen-lockfile
```

## Before you finish

```bash
bun run check     # type-check + lint + format + unit tests + override validation
bun run test:e2e  # Playwright
```

`check` is the default pre-commit gate. Run `test:e2e` for UI/routing changes.

## E2E / Playwright

`bun install` does **not** download browser binaries. If e2e fails immediately with `Executable doesn't exist` under `~/.cache/ms-playwright/`, run:

```bash
bun run test:e2e:install
bun run test:e2e
```

Do **not** start a separate dev server for e2e — `playwright.config.ts` starts Vite on port 4173 via `webServer`.

## GitHub — PRs, issues, comments

When creating or posting on GitHub (`gh pr create`, `gh issue comment`, etc.):

### 1. Attribution (required)

Start **every** PR description, issue body, and comment with:

```
Written by :robot: <model-name> <version> <effort-level>:
```

Use **your actual model name, version and effort level**, not a generic label. Example: `Written by :robot: Claude Opus 5.5 high:`

### 2. PR descriptions — link the issue first

After the attribution line, the **next line** must be:

```
Closes #<issue-id>
```

Then the PR summary (what changed, test plan). `Closes` auto-closes the issue on merge.

**Example PR body** (model name is illustrative — use yours):

```
Written by :robot: <model-name> <version> <effort-level>:

Closes #42

## Summary
- …

## Test plan
- …
```

### 3. Don't repeat yourself

- **PR body** = full description (summary, test plan, context).
- **Issue comments** = short status only — e.g. "Opened PR #99" with a link. Do **not** paste or paraphrase the PR body.
- Readers should get details once, from the PR.
