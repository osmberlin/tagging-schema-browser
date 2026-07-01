# Cursor Cloud specific instructions

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
