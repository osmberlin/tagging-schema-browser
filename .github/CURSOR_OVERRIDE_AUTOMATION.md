# Schema override → Cursor automation

Preset detail panels can open pre-filled GitHub issues for intentional schema review overrides. One workflow posts an `@cursor` comment to start a cloud agent; another squash-merges the agent PR after CI.

## Supported override kinds

| Kind                   | Browser panel             | Issue labels                                      | Override file                                 |
| ---------------------- | ------------------------- | ------------------------------------------------- | --------------------------------------------- |
| Missing inheritance    | `MissingInheritancePanel` | `cursor-override`, `missing-inheritance-override` | `src/data/missing-inheritance-overrides.yaml` |
| Risky typeCombo (#131) | (future)                  | `cursor-override`, `risky-typecombo-override`     | `src/data/risky-typecombo-overrides.yaml`     |

## Who speaks on GitHub

| Surface                  | GitHub identity             | How we mark it                                                                                                |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Issue body               | Human submitter             | Blockquote banner in issue body (human vs tool vs agent)                                                      |
| Workflow trigger comment | `github-actions[bot]`       | `> **GitHub Actions (automation)** — …` in [cursorOverrideAutomation.ts](scripts/cursorOverrideAutomation.ts) |
| Agent PR and comments    | Cursor app / connected user | `**[Cursor Agent]**` prefix + `Written by :robot_face:` in PR body                                            |

## Flow

1. User clicks **Create GitHub issue** on a preset with unreviewed or stale missing inheritance.
2. [cursor-override-automation.yml](workflows/cursor-override-automation.yml) runs on `issues: opened` or when a trigger label is added.
3. The workflow posts `@cursor repo=… branch=main` (skips if one already exists).
4. The agent reads the issue body, follows [.cursor/skills/apply-schema-override/SKILL.md](../.cursor/skills/apply-schema-override/SKILL.md), updates the override YAML, and opens a PR with `Closes #N` and label `schema-override`.
5. [schema-override-auto-merge.yml](workflows/schema-override-auto-merge.yml) squash-merges when CI is green and only `src/data/*-overrides.yaml` changed.

## Repository requirements

- [Cursor GitHub integration](https://cursor.com/docs/integrations/github) on `osmberlin/tagging-schema-browser` with issue access.
- GitHub Actions enabled.
- Issue templates under `.github/ISSUE_TEMPLATE/` apply trigger labels automatically.

## Why not a native “issue opened” automation trigger?

[Cursor Automations](https://cursor.com/docs/cloud-agent/automations) support pull request events, not issue opened. The `@cursor` comment via GitHub Actions is the integration path (same as [osm-traffic-sign-tool](https://github.com/osmberlin/osm-traffic-sign-tool/blob/main/.github/CURSOR_QA_AUTOMATION.md)).

## UI utility

`buildSchemaOverrideIssueUrl` in `src/utils/schemaOverrideIssue.ts` builds the GitHub new-issue deep link (`template`, `title`, `body`).
