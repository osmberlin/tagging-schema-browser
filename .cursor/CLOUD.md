# Cursor Cloud specific instructions

## Dependency install

Always install dependencies with the lockfile:

```bash
bun install --frozen-lockfile
```

Do **not** run plain `bun install` in cloud agents. Without the lockfile, Bun can hoist a newer nested `rolldown` under `vite` than the one Vite 8 expects, which breaks dev/build with:

```text
Export named 'viteWasmFallbackPlugin' not found in module 'rolldown/experimental'
```

If Vite fails to start, reinstall cleanly:

```bash
rm -rf node_modules && bun install --frozen-lockfile
```

The cloud environment (`.cursor/environment.json`) runs this install automatically on agent startup.

## Verification before finishing work

```bash
bun run check     # type-check + lint + format + unit tests + override validation
bun run test:e2e  # Playwright (browsers installed by environment setup)
```

`check` is the default pre-commit gate. Run `test:e2e` for UI/routing changes.

## E2E / Playwright

`bun install` does **not** download browser binaries. The cloud environment installs Chromium via:

```bash
bunx playwright install --with-deps chromium
```

If e2e fails immediately with `Executable doesn't exist` under `~/.cache/ms-playwright/`, run:

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
Written by :robot_face: <model-name>:
```

Use **your actual model name** (the one shown in Cursor), not a generic label. Example: `Written by :robot_face: Cursor Composer 2.5:`

No exceptions.

### 2. PR descriptions — link the issue first

After the attribution line, the **next line** must be:

```
Closes #<issue-id>
```

Then the PR summary (what changed, test plan). `Closes` auto-closes the issue on merge.

**Example PR body** (model name is illustrative — use yours):

```
Written by :robot_face: Cursor Composer 2.5:

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

## Agent orchestration

This repo includes Fable/Composer orchestration for Cursor IDE (`.cursor/agents/`, `@orchestrator-worker` rule). Cloud agents do not need to run `init-cursor.sh` — those files are committed.

For large multi-step tasks, delegate discovery and implementation rather than doing everything inline; run `bun run check` before declaring done. See [docs/agent-orchestration-cursor.md](../docs/agent-orchestration-cursor.md).
