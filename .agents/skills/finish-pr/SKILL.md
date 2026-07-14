---
name: finish-pr
description: >-
  Cloud agent workflow for osmberlin/tagging-schema-browser: finish-work and
  push, rebase on main, mark PR ready, wait for Bugbot and fix findings,
  parallel react-dev code review, rebase merge when green. Use for
  finish PR, ready for review, Bugbot follow-up, or merge my PR on this repo.
user-invocable: true
disable-model-invocation: true
---

# Finish PR

**Repo:** `osmberlin/tagging-schema-browser` · **Base:** `main`

Cloud-agent workflow to finish the current feature PR.

```
- [ ] finish-work + push
- [ ] rebase on origin/main + push
- [ ] PR ready → Bugbot green
- [ ] parallel: Bugbot fixes | review (react-dev)
- [ ] rebase merge
```

## 1. finish-work + push

Load [`finish-work`](../finish-work/SKILL.md), then **always push** (this skill continues past finish-work’s default stop).

## 2. Rebase on main

Rebase the branch on `origin/main`, resolve conflicts, push (`--force-with-lease` after rebase).

## 3. PR ready and Bugbot

- Mark the PR **ready for review** (undraft).
- **Push** is the normal Bugbot trigger on this repo — wait for the **`Cursor Bugbot`** check via `ManagePullRequest` `get_ci_status`.
- If Bugbot does not run after a push, `post_comment` with `bugbot run` as a **top-level** PR comment (not a thread reply).
- Bugbot findings are already on the PR — read them from the run context; no `gh` GraphQL needed.

Done when `Cursor Bugbot` is **success**.

## 4. Parallel lanes

Run both; loop until clean.

**Bugbot** — fix in code → finish-work + push → on each addressed thread: `post_comment` (`in_reply_to` the review comment) with commit SHA and one-line summary; follow attribution in [.cursor/CLOUD.md](../../../.cursor/CLOUD.md). Then `resolve_comment`. If thread reply fails (permissions), post a top-level comment citing path, line, and SHA instead.

**Review** — load [`react-dev`](../react-dev/SKILL.md); fix findings → finish-work + push.

## 5. Merge

When `get_ci_status` is green, `Cursor Bugbot` success, branch rebased on `main`, and no blocking unresolved threads:

```bash
gh pr merge --rebase --delete-branch
```

Ask before merge if checks cannot be fixed or the user said not to merge.
