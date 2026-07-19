---
name: apply-schema-override
description: >-
  Apply a schema override YAML snapshot from a GitHub issue into the correct
  overrides file, validate with bun run check, and open a PR that closes the issue.
---

# Apply schema override

Use when a GitHub issue was opened from the Tagging Schema Browser with a title starting
`[missing-inheritance]` or `[risky-typecombo]`.

GitHub Actions launches a Cursor cloud agent via the Cloud Agents API when you
**manually run** the workflow (see `.github/workflows/cursor-override-automation.yml`).
Pick the audit kind (`missing-inheritance` or `risky-typecombo`); all open issues with
that title prefix are processed in **one PR** with a `Closes #…` line per issue.
The issue bodies are included in the agent prompt.

## 1. Parse the issue

Read the issue body and extract:

- **Kind** from the issue title prefix:
  - `[missing-inheritance]` → `src/data/missing-inheritance-overrides.yaml`
  - `[risky-typecombo]` → `src/data/risky-typecombo-overrides.yaml`
- **Preset ids** from:
  - `## Entries` lines like `` `preset/id (fields)` — Intentional (false positive) ``
  - or a single-issue `Preset: \`…\`` line (legacy)
  - or preset keys under `presets:` in the YAML blocks
- **Intentional overrides** from the fenced ` ```yaml ` block under **Snapshot** (`version: 1` / `presets:`)
- **Stale removals** from the fenced ` ```yaml ` block under **Remove stale overrides** — delete those preset keys from the overrides file (do not apply them as snapshots)
- **Needs upstream work** from `## Needs upstream work` — track in the PR summary only; do not write overrides for these presets

Batch issues may list many presets in one issue. Process every entry in **Entries** that has a Snapshot or Remove stale section.

## 2. Commit 1 — apply the issue snapshot

Make one commit for the issue’s primary change:

- Open the target file under `src/data/`.
- Ensure top-level `version: 1` and `presets:` exist.
- Insert or replace each intentional preset entry from **Snapshot** (two-space indent under `presets:`).
- Delete each preset key listed under **Remove stale overrides**.
- Keep preset keys sorted alphabetically when practical.
- Do not change unrelated preset entries in this commit.
- `fields` and `moreFields` are separate override sections (both are audited). Apply
  only the lists present in the issue snapshot — do not add the other list unless the
  snapshot includes it. A partial snapshot is valid; the preset stays unreviewed until
  every detected list is documented.

**Commit message example:** `Overrides: mark {presetId} missing inheritance as intentional`

## 3. Commit 2 — clean other stale overrides (if any)

Run `bun run validate-inheritance-overrides` (or `bun run check`). If validation reports **other** stale preset ids in the same file, fix them in a **second commit**:

- Remove override entries that are stale because live detection no longer applies.
- Update entries that are stale because the snapshot drifted only when they are **not** covered by the issue (those were handled in commit 1).

Do not mix unrelated stale cleanup into commit 1. Aim for **one or two commits per PR**:

1. Apply / update / remove the issue’s presets.
2. (Optional) Remove or fix any remaining stale entries so validation passes.

**Commit message example:** `Overrides: remove stale entries for {presetA}, {presetB}`

## 4. Validate

```bash
bun run check
```

This runs `validate-inheritance-overrides` and `validate-risky-typecombo-overrides` against the published release schema. All stale entries must be resolved before opening the PR.

## 5. Open a pull request

- **Title:** `[skip netlify] Overrides: mark {presetId} missing inheritance as intentional` (adjust wording for typeCombo, batch, or stale removal when applicable)
- **Body:** Start with `Written by :robot: <model-name>:` then one `Closes #<issue-number>` line per issue the PR resolves, then a short user-facing summary of what was recorded and why (intentional omission or stale cleanup).
- **Label:** `schema-override` (required for auto-merge)
- **Ready for review:** open the PR **not** as a draft (`gh pr create` without `--draft`). If GitHub still opens a draft, run `gh pr ready` before finishing.
- Only touch the relevant `src/data/*-overrides.yaml` file.
- Keep the branch to **1–2 commits** (issue change, then optional stale cleanup).

## 6. Auto-merge

CI must pass. Only one `schema-override` PR is open at a time so parallel agents do not conflict on the same YAML file. After a batch PR merges, **manually run** **Cursor override automation** again to process the next set of queued issues. The `schema-override-auto-merge` workflow updates the branch from `main`, then **rebase-merges** eligible PRs once checks pass (YAML-only override change; typically 1–2 commits). Netlify deploy previews are skipped for YAML-only override PRs (see `scripts/netlify-deploy-preview-ignore.sh`).

## Attribution

Prefix agent comments and PR descriptions with `**[Cursor Agent]**` when interacting on GitHub (in addition to the `Written by :robot:` line in PR bodies per AGENTS.md).
