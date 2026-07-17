const GHA_ATTRIBUTION =
  '> **GitHub Actions (automation)** — This comment only starts the Cursor cloud agent. It is not written by the issue author.\n\n'

export const CURSOR_TRIGGER_MARKER = '@cursor repo='

/** Mandatory issue title prefixes — users may edit the title after the closing `]`. */
export const OVERRIDE_TITLE_PREFIXES = {
  'missing-inheritance': '[missing-inheritance]',
  'risky-typecombo': '[risky-typecombo]',
} as const

export type OverrideTriggerKind = keyof typeof OVERRIDE_TITLE_PREFIXES

export const KIND_CONFIG = {
  'missing-inheritance': {
    title: 'Missing inheritance override',
    skill: '.agents/skills/apply-schema-override/SKILL.md',
  },
  'risky-typecombo': {
    title: 'Risky typeCombo override',
    skill: '.agents/skills/apply-schema-override/SKILL.md',
  },
} as const satisfies Record<OverrideTriggerKind, { title: string; skill: string }>

export const resolveActiveKindFromTitle = (title: string): OverrideTriggerKind | null => {
  const trimmed = title.trim()
  for (const kind of ['missing-inheritance', 'risky-typecombo'] as const) {
    if (trimmed.startsWith(OVERRIDE_TITLE_PREFIXES[kind])) return kind
  }
  return null
}

export const hasExistingCursorTrigger = (comments: { body?: string | null }[]) =>
  comments.some((comment) => comment.body?.includes(CURSOR_TRIGGER_MARKER))

export const resolveSourceBranch = (body: string) => {
  const quoted = body.match(/\*\*Source branch:\*\*\s*`([^`]+)`/)
  if (quoted) return quoted[1]
  return 'main'
}

export const resolveSkillInstruction = (config: (typeof KIND_CONFIG)[OverrideTriggerKind]) =>
  `Follow \`${config.skill}\`.`

export const buildCursorTriggerCommentBody = ({
  owner,
  repo,
  issueNumber,
  activeKind,
  issueBody,
}: {
  owner: string
  repo: string
  issueNumber: number
  activeKind: OverrideTriggerKind
  issueBody: string
}) => {
  const config = KIND_CONFIG[activeKind]
  const branch = resolveSourceBranch(issueBody)
  const skillInstruction = resolveSkillInstruction(config)

  return `${GHA_ATTRIBUTION}@cursor repo=${owner}/${repo} branch=${branch}

**${config.title}** #${issueNumber} (\`${OVERRIDE_TITLE_PREFIXES[activeKind]}\`). Read the issue body. ${skillInstruction} Open a PR with \`Closes #${issueNumber}\` and add the \`schema-override\` label. Prefix comments and PR description with \`**[Cursor Agent]**\`.`
}

type IssuesEvent = {
  issue: {
    number: number
    title: string
    body: string | null
  }
}

const githubApi = async <T>(token: string, path: string, init?: RequestInit): Promise<T> => {
  const extraHeaders =
    init?.headers &&
    typeof init.headers === 'object' &&
    !Array.isArray(init.headers) &&
    !(init.headers instanceof Headers)
      ? init.headers
      : {}

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...extraHeaders,
    },
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
  const activeKind = resolveActiveKindFromTitle(issue.title)

  if (!activeKind) {
    console.log('No Cursor override title prefix found on issue; skipping.')
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
    activeKind,
    issueBody: issue.body ?? '',
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
