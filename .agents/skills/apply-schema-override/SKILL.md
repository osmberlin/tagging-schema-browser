---
name: apply-schema-override
description: >-
  How schema override issues from the Tagging Schema Browser audit pages become PRs,
  and how to fix such a PR by hand (merge conflicts, failing validation).
---

# Apply schema override

Issues opened from `/audits/missing-inheritance` or `/audits/risky-typecombo` have a title
starting with `[missing-inheritance]` or `[risky-typecombo]` and contain a
` ```json override-changes ` block (format: `src/components/PageAudits/overrideChanges.ts`).

## Normal flow (no agent needed)

1. A trusted user submits the issue.
2. `.github/workflows/schema-override-pr.yml` runs `.github/scripts/applyOverrideIssue.ts`,
   which applies the block to `src/data/*-overrides.yaml`, and opens a PR on the branch
   `schema-override/issue-<n>` with `Closes #<n>` and the `schema-override` label.
3. CI validates the YAML against the live schema. Merge (or run **Schema override auto-merge**).

Per change: `add` ids are recorded as intentional skips, `remove` ids are deleted
(empty lists and presets are removed). "Fix upstream" decisions are only listed in the issue.

## When the PR needs help

- **Merge conflict / behind main:** re-run **Schema override PR** with the issue number.
  The branch is rebuilt from the latest `main`, so there is nothing to resolve by hand.
- **Validation fails** (e.g. the schema changed since the audit): run
  `bun run validate-inheritance-overrides` / `bun run validate-risky-typecombo-overrides`
  locally and fix the YAML on the PR branch, or open a fresh audit issue.
- **Workflow cannot parse the issue** (block edited by hand): fix the JSON in the issue body,
  then re-run the workflow with the issue number.
