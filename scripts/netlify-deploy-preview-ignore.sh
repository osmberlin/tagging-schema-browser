#!/usr/bin/env bash
# Netlify deploy-preview ignore hook (exit 0 = skip build, exit 1 = build).
# Wired from netlify.toml [context.deploy-preview]. Production GitHub Pages deploys are unaffected.
set -euo pipefail

only_override_yaml_paths() {
  local changed="$1"
  [ -n "$changed" ] || return 1
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if ! [[ "$file" =~ ^src/data/.*-overrides\.yaml$ ]]; then
      return 1
    fi
  done <<< "$changed"
  return 0
}

changed_files_in_pr() {
  git fetch origin main:refs/remotes/origin/main 2>/dev/null || true
  local merge_base
  merge_base=$(git merge-base HEAD origin/main 2>/dev/null || true)
  if [ -n "$merge_base" ]; then
    git diff --name-only "$merge_base" HEAD
    return
  fi
  if git rev-parse HEAD^ >/dev/null 2>&1; then
    git diff --name-only HEAD^ HEAD
  fi
}

# Dependabot deps-only PRs
if git log -1 --pretty=%ae | grep -qi dependabot; then
  exit 0
fi

# Explicit skip marker in the latest commit message
if git log -1 --pretty=%B | grep -qi '\[skip netlify\]'; then
  exit 0
fi

# Schema override PRs: YAML-only changes under src/data/*-overrides.yaml
changed=$(changed_files_in_pr || true)
if only_override_yaml_paths "$changed"; then
  exit 0
fi

exit 1
