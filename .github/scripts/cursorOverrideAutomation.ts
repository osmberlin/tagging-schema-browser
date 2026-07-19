const GHA_ATTRIBUTION =
  '> **GitHub Actions (automation)** — Started a Cursor cloud agent via API. It is not written by the issue author.\n\n'

export const CURSOR_AGENTS_API_URL = 'https://api.cursor.com/v0/agents'

/** Posted on the issue after a successful Cloud Agents API launch. */
export const AGENT_LAUNCHED_MARKER = '**[Cursor Agent API]**'

/** Applied when stage-one enqueues an agent; used for deduplication. */
export const ENQUEUED_LABEL = 'schema-override-agent-enqueued'

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

export const hasEnqueuedLabel = (labels: { name: string }[]) =>
  labels.some((label) => label.name === ENQUEUED_LABEL)

/** Matches GitHub closing keywords in PR descriptions (Closes #123, Fixes #123, …). */
export const CLOSING_KEYWORD_PATTERN = /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi

export const extractClosingIssueNumbers = (text: string) => {
  const issueNumbers = new Set<number>()
  for (const match of text.matchAll(CLOSING_KEYWORD_PATTERN)) {
    const issueNumber = Number.parseInt(match[1] ?? '', 10)
    if (Number.isFinite(issueNumber)) {
      issueNumbers.add(issueNumber)
    }
  }
  return [...issueNumbers]
}

export const resolveSourceBranch = (body: string) => {
  const quoted = body.match(/\*\*Source branch:\*\*\s*`([^`]+)`/)
  if (quoted) return quoted[1]
  return 'main'
}

export const buildAgentPrompt = ({
  owner,
  repo,
  issueNumber,
  issueTitle,
  activeKind,
  issueBody,
}: {
  owner: string
  repo: string
  issueNumber: number
  issueTitle: string
  activeKind: OverrideTriggerKind
  issueBody: string
}) => {
  const branch = resolveSourceBranch(issueBody)

  return [
    `Apply the schema override described in GitHub issue #${issueNumber} for ${owner}/${repo}.`,
    '',
    `Issue title: ${issueTitle}`,
    `Kind: ${OVERRIDE_TITLE_PREFIXES[activeKind]}`,
    `Base branch: ${branch}`,
    '',
    'Follow the skill at `.agents/skills/apply-schema-override/SKILL.md` in the repository.',
    '',
    'Requirements:',
    `- Read the issue body below for the YAML snapshot and preset id.`,
    `- Open a PR ready for review (not draft) with \`Closes #${issueNumber}\` on its own line.`,
    `- Add the \`schema-override\` label to the PR.`,
    `- Prefix the PR description with \`**[Cursor Agent]**\` and include \`Written by :robot: <model-name>:\`.`,
    `- Only change the relevant \`src/data/*-overrides.yaml\` file.`,
    `- Run \`bun run check\` before opening the PR.`,
    '',
    '---',
    'Issue body:',
    issueBody.trim() || '(empty)',
  ].join('\n')
}

export const buildAgentLaunchedCommentBody = ({
  issueNumber,
  agentUrl,
}: {
  issueNumber: number
  agentUrl: string
}) => `${GHA_ATTRIBUTION}${AGENT_LAUNCHED_MARKER} Agent for #${issueNumber}: ${agentUrl}`

type CursorAgentLaunchResponse = {
  id: string
  target?: {
    url?: string
  }
}

type IssuesEvent = {
  issue: {
    number: number
    title: string
    body: string | null
    labels?: { name: string }[]
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

const cursorApi = async <T>(apiKey: string, path: string, init?: RequestInit): Promise<T> => {
  const extraHeaders =
    init?.headers &&
    typeof init.headers === 'object' &&
    !Array.isArray(init.headers) &&
    !(init.headers instanceof Headers)
      ? init.headers
      : {}

  const response = await fetch(`${CURSOR_AGENTS_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      ...extraHeaders,
    },
  })

  if (!response.ok) {
    throw new Error(`Cursor API ${response.status}: ${await response.text()}`)
  }

  return response.json() as Promise<T>
}

export const launchCursorAgent = async ({
  apiKey,
  owner,
  repo,
  issueNumber,
  issueTitle,
  activeKind,
  issueBody,
}: {
  apiKey: string
  owner: string
  repo: string
  issueNumber: number
  issueTitle: string
  activeKind: OverrideTriggerKind
  issueBody: string
}) => {
  const branch = resolveSourceBranch(issueBody)
  const prompt = buildAgentPrompt({
    owner,
    repo,
    issueNumber,
    issueTitle,
    activeKind,
    issueBody,
  })

  return cursorApi<CursorAgentLaunchResponse>(apiKey, '', {
    method: 'POST',
    body: JSON.stringify({
      prompt: { text: prompt },
      model: 'default',
      source: {
        repository: `https://github.com/${owner}/${repo}`,
        ref: branch,
      },
      target: {
        autoCreatePr: true,
        branchName: `cursor/schema-override-${issueNumber}`,
      },
    }),
  })
}

const resolveAgentUrl = (agent: CursorAgentLaunchResponse) =>
  agent.target?.url ?? `https://cursor.com/agents?id=${agent.id}`

export const runCursorOverrideAutomation = async ({
  githubToken,
  cursorApiKey,
  repository,
  event,
  forceRestart = false,
}: {
  githubToken: string
  cursorApiKey: string
  repository: string
  event: IssuesEvent
  forceRestart?: boolean
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

  const hasPr = await hasOpenOverridePullRequest({
    token: githubToken,
    repository,
    issueNumber: issue.number,
  })
  if (hasPr) {
    console.log(`Issue #${issue.number} already has an open PR; skipping.`)
    return
  }

  const openSchemaOverridePrs = await listOpenSchemaOverridePullRequests({
    token: githubToken,
    repository,
  })
  if (openSchemaOverridePrs.length > 0) {
    console.log(
      `Schema override PR #${openSchemaOverridePrs[0]?.number} is open; queueing issue #${issue.number}.`,
    )
    return
  }

  const { labels } = await githubApi<{ labels: { name: string }[] }>(
    githubToken,
    `/repos/${owner}/${repo}/issues/${issue.number}`,
  )

  if (!forceRestart && hasEnqueuedLabel(labels)) {
    console.log(`Issue #${issue.number} already has ${ENQUEUED_LABEL}; skipping.`)
    return
  }

  const agent = await launchCursorAgent({
    apiKey: cursorApiKey,
    owner,
    repo,
    issueNumber: issue.number,
    issueTitle: issue.title,
    activeKind,
    issueBody: issue.body ?? '',
  })

  const agentUrl = resolveAgentUrl(agent)
  console.log(`Launched Cursor agent ${agent.id} for issue #${issue.number}: ${agentUrl}`)

  await githubApi(githubToken, `/repos/${owner}/${repo}/issues/${issue.number}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body: buildAgentLaunchedCommentBody({ issueNumber: issue.number, agentUrl }),
    }),
  })

  await githubApi(githubToken, `/repos/${owner}/${repo}/issues/${issue.number}/labels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labels: [ENQUEUED_LABEL] }),
  })
}

type GitHubIssue = {
  number: number
  title: string
  body: string | null
  pull_request?: unknown
}

export const listOpenOverrideIssues = async ({
  token,
  repository,
  issueNumbers,
}: {
  token: string
  repository: string
  issueNumbers?: number[]
}) => {
  const [owner, repo] = repository.split('/')
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY: ${repository}`)
  }

  if (issueNumbers && issueNumbers.length > 0) {
    const issues = await Promise.all(
      issueNumbers.map((number) =>
        githubApi<GitHubIssue>(token, `/repos/${owner}/${repo}/issues/${number}`),
      ),
    )
    return issues.filter((issue) => resolveActiveKindFromTitle(issue.title))
  }

  const issues = await githubApi<GitHubIssue[]>(
    token,
    `/repos/${owner}/${repo}/issues?state=open&per_page=100`,
  )

  return issues
    .filter((issue) => !issue.pull_request)
    .filter((issue) => resolveActiveKindFromTitle(issue.title))
}

export const listOpenSchemaOverridePullRequests = async ({
  token,
  repository,
}: {
  token: string
  repository: string
}) => {
  const [owner, repo] = repository.split('/')
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY: ${repository}`)
  }

  const issues = await githubApi<GitHubIssue[]>(
    token,
    `/repos/${owner}/${repo}/issues?state=open&labels=schema-override&per_page=100`,
  )

  return issues.filter((issue) => issue.pull_request)
}

export const hasOpenOverridePullRequest = async ({
  token,
  repository,
  issueNumber,
}: {
  token: string
  repository: string
  issueNumber: number
}) => {
  const [owner, repo] = repository.split('/')
  const pulls = await githubApi<{ number: number }[]>(
    token,
    `/repos/${owner}/${repo}/pulls?state=open&per_page=100`,
  )

  for (const pull of pulls) {
    const body = await githubApi<{ body: string | null }>(
      token,
      `/repos/${owner}/${repo}/pulls/${pull.number}`,
    )
    if (
      body.body?.includes(`Closes #${issueNumber}`) ||
      body.body?.includes(`closes #${issueNumber}`)
    ) {
      return true
    }
  }

  return false
}

export const closeLinkedIssuesForPullRequest = async ({
  token,
  repository,
  pullRequestNumber,
}: {
  token: string
  repository: string
  pullRequestNumber: number
}) => {
  const [owner, repo] = repository.split('/')
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY: ${repository}`)
  }

  const pullRequest = await githubApi<{ body: string | null; merged: boolean }>(
    token,
    `/repos/${owner}/${repo}/pulls/${pullRequestNumber}`,
  )

  if (!pullRequest.merged) {
    console.log(`PR #${pullRequestNumber} is not merged; skipping linked issue close.`)
    return []
  }

  const issueNumbers = extractClosingIssueNumbers(pullRequest.body ?? '')
  if (issueNumbers.length === 0) {
    console.log(`PR #${pullRequestNumber} has no closing keywords in its body.`)
    return []
  }

  const closedIssueNumbers: number[] = []
  for (const issueNumber of issueNumbers) {
    const issue = await githubApi<{ state: string }>(
      token,
      `/repos/${owner}/${repo}/issues/${issueNumber}`,
    )
    if (issue.state === 'closed') {
      console.log(`Issue #${issueNumber} is already closed.`)
      continue
    }

    await githubApi(token, `/repos/${owner}/${repo}/issues/${issueNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed', state_reason: 'completed' }),
    })
    console.log(`Closed issue #${issueNumber} after merging PR #${pullRequestNumber}.`)
    closedIssueNumbers.push(issueNumber)
  }

  return closedIssueNumbers
}

export const launchNextSchemaOverrideIssue = async ({
  githubToken,
  cursorApiKey,
  repository,
  issueNumbers,
}: {
  githubToken: string
  cursorApiKey: string
  repository: string
  issueNumbers?: number[]
}) => {
  const openSchemaOverridePrs = await listOpenSchemaOverridePullRequests({
    token: githubToken,
    repository,
  })
  if (openSchemaOverridePrs.length > 0) {
    console.log(
      `Schema override PR #${openSchemaOverridePrs[0]?.number} is still open; not launching the next issue.`,
    )
    return
  }

  const issues = await listOpenOverrideIssues({ token: githubToken, repository, issueNumbers })
  const pendingIssues = issues
    .filter((issue) => issue.number)
    .sort((left, right) => left.number - right.number)

  for (const issue of pendingIssues) {
    const hasPr = await hasOpenOverridePullRequest({
      token: githubToken,
      repository,
      issueNumber: issue.number,
    })
    if (hasPr) continue

    await runCursorOverrideAutomation({
      githubToken,
      cursorApiKey,
      repository,
      event: { issue },
      forceRestart: true,
    })
    return
  }

  console.log('No pending schema override issues to launch.')
}

export const restartSchemaOverrideIssues = async ({
  githubToken,
  cursorApiKey,
  repository,
  issueNumbers,
}: {
  githubToken: string
  cursorApiKey: string
  repository: string
  issueNumbers?: number[]
}) => {
  await launchNextSchemaOverrideIssue({
    githubToken,
    cursorApiKey,
    repository,
    issueNumbers,
  })
}

type PullRequestClosedEvent = {
  action: 'closed'
  pull_request: {
    merged: boolean
    labels?: { name: string }[]
  }
}

const runFromGitHubActions = async () => {
  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN is required')
  }

  const repository = process.env.GITHUB_REPOSITORY
  if (!repository) {
    throw new Error('GITHUB_REPOSITORY is required')
  }

  if (process.env.CLOSE_LINKED_ISSUES_FROM_PR) {
    const pullRequestNumber = Number.parseInt(process.env.CLOSE_LINKED_ISSUES_FROM_PR, 10)
    if (!Number.isFinite(pullRequestNumber)) {
      throw new Error(
        `Invalid CLOSE_LINKED_ISSUES_FROM_PR: ${process.env.CLOSE_LINKED_ISSUES_FROM_PR}`,
      )
    }
    await closeLinkedIssuesForPullRequest({
      token: githubToken,
      repository,
      pullRequestNumber,
    })
    return
  }

  const cursorApiKey = process.env.CURSOR_API_KEY
  if (!cursorApiKey) {
    throw new Error('CURSOR_API_KEY is required')
  }

  if (
    process.env.RESTART_SCHEMA_OVERRIDE_ISSUES === 'true' ||
    process.env.LAUNCH_NEXT_SCHEMA_OVERRIDE === 'true'
  ) {
    const issueNumbers = process.env.ISSUE_NUMBERS?.split(',')
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value))
    await launchNextSchemaOverrideIssue({
      githubToken,
      cursorApiKey,
      repository,
      issueNumbers: issueNumbers && issueNumbers.length > 0 ? issueNumbers : undefined,
    })
    return
  }

  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH is required')
  }

  const event = (await Bun.file(eventPath).json()) as IssuesEvent | PullRequestClosedEvent

  if (
    'pull_request' in event &&
    event.action === 'closed' &&
    event.pull_request.merged &&
    event.pull_request.labels?.some((label) => label.name === 'schema-override')
  ) {
    await launchNextSchemaOverrideIssue({ githubToken, cursorApiKey, repository })
    return
  }

  if ('issue' in event) {
    await runCursorOverrideAutomation({ githubToken, cursorApiKey, repository, event })
  }
}

if (import.meta.main) {
  await runFromGitHubActions()
}
