const GHA_ATTRIBUTION =
  '> **GitHub Actions (automation)** — This comment only starts the Cursor cloud agent. It is not written by the issue author.\n\n'

export const CURSOR_TRIGGER_MARKER = '@cursor repo='

export const OVERRIDE_KIND_LABELS = [
  'missing-inheritance-override',
  'risky-typecombo-override',
] as const

export type OverrideKindLabel = (typeof OVERRIDE_KIND_LABELS)[number]

export const OVERRIDE_SKILL_PATH = '.cursor/skills/apply-schema-override/SKILL.md'

export const LABEL_CONFIG = {
  'missing-inheritance-override': {
    title: 'Missing inheritance override',
    kind: 'missing-inheritance',
  },
  'risky-typecombo-override': {
    title: 'Risky typeCombo override',
    kind: 'risky-typecombo',
  },
} as const satisfies Record<OverrideKindLabel, { title: string; kind: string }>

export const resolveActiveLabel = (issueLabels: string[]): OverrideKindLabel | null => {
  for (const label of OVERRIDE_KIND_LABELS) {
    if (issueLabels.includes(label)) {
      return label
    }
  }
  return null
}

export const hasExistingCursorTrigger = (comments: { body?: string | null }[]) =>
  comments.some((comment) => comment.body?.includes(CURSOR_TRIGGER_MARKER))

export const buildCursorTriggerCommentBody = ({
  owner,
  repo,
  issueNumber,
  activeLabel,
}: {
  owner: string
  repo: string
  issueNumber: number
  activeLabel: OverrideKindLabel
}) => {
  const config = LABEL_CONFIG[activeLabel]

  return `${GHA_ATTRIBUTION}@cursor repo=${owner}/${repo} branch=main

**${config.title}** #${issueNumber} (\`${activeLabel}\`, kind \`${config.kind}\`). Read the issue body. Follow \`${OVERRIDE_SKILL_PATH}\`. Open a PR with label \`schema-override\` and \`Closes #${issueNumber}\`. Prefix comments and PR description with \`**[Cursor Agent]**\`.`
}

type IssueLabel = string | { name: string }

type IssuesEvent = {
  issue: {
    number: number
    body: string | null
    labels: IssueLabel[]
  }
}

const getIssueLabels = (labels: IssueLabel[]) =>
  labels.map((label) => (typeof label === 'string' ? label : label.name))

const githubApi = async <T>(token: string, path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/vnd.github+json')
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('X-GitHub-Api-Version', '2022-11-28')

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`)
  }

  return response.json() as Promise<T>
}

export const runCursorOverrideAutomation = async ({
  token,
  repository,
  event,
}: {
  token: string
  repository: string
  event: IssuesEvent
}) => {
  const [owner, repo] = repository.split('/')
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY: ${repository}`)
  }

  const issue = event.issue
  const issueLabels = getIssueLabels(issue.labels)
  const activeLabel = resolveActiveLabel(issueLabels)

  if (!activeLabel) {
    console.log('No schema override kind label found on issue; skipping.')
    return
  }

  const comments = await githubApi<{ body?: string | null }[]>(
    token,
    `/repos/${owner}/${repo}/issues/${issue.number}/comments?per_page=100`,
  )

  if (hasExistingCursorTrigger(comments)) {
    console.log('Cursor trigger already exists (@cursor comment); skipping.')
    return
  }

  const body = buildCursorTriggerCommentBody({
    owner,
    repo,
    issueNumber: issue.number,
    activeLabel,
  })

  await githubApi(token, `/repos/${owner}/${repo}/issues/${issue.number}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
}

const runFromGitHubActions = async () => {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GITHUB_TOKEN is required')
  }

  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH is required')
  }

  const repository = process.env.GITHUB_REPOSITORY
  if (!repository) {
    throw new Error('GITHUB_REPOSITORY is required')
  }

  const event = (await Bun.file(eventPath).json()) as IssuesEvent

  await runCursorOverrideAutomation({ token, repository, event })
}

if (import.meta.main) {
  await runFromGitHubActions()
}
