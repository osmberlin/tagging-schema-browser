import { prPreviewDataUrl } from '@/utils/prPreviewUrl'

export const ID_TAGGING_SCHEMA_REPO = 'openstreetmap/id-tagging-schema'
export const PR_LIST_KEY = ['id-tagging-schema', 'pulls', { perPage: 30 }] as const

export type PrPreviewRow = {
  number: number
  title: string
  htmlUrl: string
  updatedAt: string
  state: 'open' | 'closed' | 'merged'
}

type GitHubPull = {
  number: number
  title: string
  html_url: string
  updated_at: string
  state: 'open' | 'closed'
  merged_at: string | null
}

function toPrPreviewRow(pull: GitHubPull): PrPreviewRow {
  return {
    number: pull.number,
    title: pull.title,
    htmlUrl: pull.html_url,
    updatedAt: pull.updated_at,
    state: pull.merged_at ? 'merged' : pull.state,
  }
}

export async function fetchRecentPulls(perPage: number): Promise<PrPreviewRow[]> {
  const url = new URL(`https://api.github.com/repos/${ID_TAGGING_SCHEMA_REPO}/pulls`)
  url.searchParams.set('state', 'all')
  url.searchParams.set('sort', 'updated')
  url.searchParams.set('direction', 'desc')
  url.searchParams.set('per_page', String(perPage))

  const response = await fetch(url)
  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    if (response.status === 403 && remaining === '0') {
      throw new Error('GitHub API rate limit reached. Try again in an hour or reload later.')
    }
    throw new Error(`Failed to load pull requests (${response.status}).`)
  }

  const pulls = (await response.json()) as GitHubPull[]
  return pulls.map(toPrPreviewRow)
}

export async function checkPreviewReady(prNumber: number): Promise<boolean> {
  const url = `${prPreviewDataUrl(prNumber)}presets.min.json`
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

export function previewStatusQueryKey(prNumber: number) {
  return ['pr-preview-status', prNumber] as const
}
