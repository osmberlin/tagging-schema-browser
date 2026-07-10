const NPM_RESOLVE_URL =
  'https://data.jsdelivr.com/v1/packages/npm/@openstreetmap/id-tagging-schema/resolved?specifier=latest'

const GITHUB_MAIN_COMMIT_URL =
  'https://api.github.com/repos/openstreetmap/id-tagging-schema/commits/main'

/** Resolve the concrete npm release behind `@latest` (e.g. "6.18.0"). */
export async function resolveReleaseVersion(): Promise<string | null> {
  try {
    const res = await fetch(NPM_RESOLVE_URL)
    if (!res.ok) return null
    const json = (await res.json()) as { version?: string }
    return json.version ?? null
  } catch {
    return null
  }
}

/** ISO timestamp of the latest commit on id-tagging-schema `main` (unreleased source). */
export async function resolveUnreleasedUpdatedAt(): Promise<string | null> {
  try {
    const res = await fetch(GITHUB_MAIN_COMMIT_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { commit?: { committer?: { date?: string } } }
    return json.commit?.committer?.date ?? null
  } catch {
    return null
  }
}

/** Compact age label for the unreleased toggle — last `main` update, not npm version. */
export function formatUnreleasedUpdatedAt(iso: string | null): string | null {
  if (!iso) return null
  const updated = new Date(iso)
  if (Number.isNaN(updated.getTime())) return null

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfUpdated = new Date(updated)
  startOfUpdated.setHours(0, 0, 0, 0)
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfUpdated.getTime()) / (24 * 60 * 60 * 1000),
  )

  if (dayDiff === 0) return 'today'
  if (dayDiff === 1) return 'yesterday'
  if (dayDiff < 14) return `${dayDiff}d ago`

  return updated.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
