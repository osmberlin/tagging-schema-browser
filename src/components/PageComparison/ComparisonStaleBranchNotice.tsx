/** Advisory when a PR-vs-unreleased diff likely reflects a branch behind main, not PR deletions. */
export function ComparisonStaleBranchNotice() {
  return (
    <div
      className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
      role="note"
    >
      <p className="font-medium text-slate-900">Large &ldquo;Removed&rdquo; list?</p>
      <p className="mt-1">
        Comparison diffs two built <code className="font-mono text-xs">dist/</code> snapshots. If
        this PR branch was opened before recent <code className="font-mono text-xs">main</code>{' '}
        changes, presets added on <code className="font-mono text-xs">main</code> since then can
        show up here as removed even though the PR did not delete them. Update the PR branch against
        current <code className="font-mono text-xs">main</code> and reload the preview for a
        meaningful diff.
      </p>
    </div>
  )
}
