---
name: apply-schema-override
description: >-
  Apply a schema override YAML snapshot from a GitHub issue into the correct
  overrides file, validate with bun run check, and open a PR that closes the issue.
---

# Apply schema override

Use when a GitHub issue was opened from the Tagging Schema Browser with labels
`cursor-override` and a kind-specific label (`missing-inheritance-override` or
`risky-typecombo-override`).

## 1. Parse the issue

Read the issue body and extract:

- **Preset id** from `Preset: \`…\``
- **Kind** from labels:
  - `missing-inheritance-override` → `src/data/missing-inheritance-overrides.yaml`
  - `risky-typecombo-override` → `src/data/risky-typecombo-overrides.yaml` (when present)
- **YAML snapshot** from the fenced ` ```yaml ` block under **Snapshot** (the `presets:` entry for the preset)

For **stale** updates, the issue may also include an **Existing override (stale)** block — replace that preset entry with the new snapshot.

## 2. Merge into the override file

- Open the target file under `src/data/`.
- Ensure top-level `version: 1` and `presets:` exist.
- Insert or replace the preset entry with the snapshot from the issue (two-space indent under `presets:`).
- Keep preset keys sorted alphabetically when practical.
- Do not change unrelated preset entries.

## 3. Validate

```bash
bun run check
```

This runs `validate-inheritance-overrides` against the published release schema. Fix any stale or unknown-preset errors before opening the PR.

## 4. Open a pull request

- **Title:** `[skip netlify] Overrides: mark {presetId} missing inheritance as intentional` (adjust wording for typeCombo when applicable; `[skip netlify]` skips Netlify deploy previews — also skipped automatically when the PR only touches override YAML)
- **Body:** Start with `Written by :robot_face: <model-name>:` then `Closes #<issue-number>` on the next line, then a short user-facing summary of what was recorded and why (intentional omission).
- **Label:** `schema-override` (required for auto-merge)
- Only touch the relevant `src/data/*-overrides.yaml` file.

## 5. Auto-merge

CI must pass. The `schema-override-auto-merge` workflow squash-merges eligible PRs from Cursor agents so each override lands as a single commit on `main`. Netlify deploy previews are skipped for YAML-only override PRs (see `scripts/netlify-deploy-preview-ignore.sh`).

## Attribution

Prefix agent comments and PR descriptions with `**[Cursor Agent]**` when interacting on GitHub (in addition to the `Written by :robot_face:` line in PR bodies per AGENTS.md).
