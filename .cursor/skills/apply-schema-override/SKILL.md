---
name: apply-schema-override
description: >-
  Apply a schema override YAML snapshot from a GitHub issue into the correct
  *-overrides.yaml file, run bun run check, and open a PR with label
  schema-override for auto-merge. Use for cursor-override issues from the
  Tagging Schema Browser.
---

# Apply schema override

Cloud agents triggered by `.github/workflows/cursor-override-automation.yml` use this skill.

## Inputs

Parse the GitHub issue body:

1. **Kind** — from the workflow comment (`kind: missing-inheritance` or `kind: risky-typecombo`) or from issue labels:
   - `missing-inheritance-override` → `src/data/missing-inheritance-overrides.yaml`
   - `risky-typecombo-override` → `src/data/risky-typecombo-overrides.yaml` (only after #131 lands)
2. **Preset id** — `**Preset:** \`...\`` line.
3. **YAML snapshot** — fenced `yaml` block under `## YAML snapshot` (or `## YAML snapshot (current detection)` for stale updates). Use the inner `presets:` entry only.
4. **Stale stored override** — when present under `## Stale override (stored)`, replace that entry with the current snapshot or remove it if detection is now clean.

## Steps

1. Read the target override file. Confirm `version: 1` and existing `presets:` map.
2. Merge the snapshot under `presets:` for the preset id:
   - Preserve alphabetical sort order of preset keys when practical.
   - Do not drop unrelated entries.
   - For stale issues with no current detection, remove the preset entry instead of adding.
3. Run `bun run check` from the repo root. Fix failures before opening the PR.
4. Open a PR:
   - **Title:** `Overrides: mark {presetId} missing inheritance as intentional` (or `… risky typeCombo as intentional` for risky-typecombo).
   - **Body:** Start with `Written by :robot_face: <your model name>:` then `Closes #<issue-number>`, then a short user-facing summary.
   - **Label:** `schema-override` (required for squash auto-merge).
5. Do not request Bugbot. CI + `validate-inheritance-overrides` is sufficient for snapshot-only YAML.

## Attribution

Prefix agent PR descriptions and issue comments with `**[Cursor Agent]**` when posting on GitHub (in addition to the `Written by :robot_face:` line in PR bodies per AGENTS.md).

## Files

| Kind | Override file |
|------|----------------|
| `missing-inheritance` | `src/data/missing-inheritance-overrides.yaml` |
| `risky-typecombo` | `src/data/risky-typecombo-overrides.yaml` |

## Validation

`bun run check` runs `validate-inheritance-overrides` against the published npm release dist. Override snapshots must match live missing-inheritance detection on release.
