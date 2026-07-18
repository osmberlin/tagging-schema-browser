import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { writeFileSync } from 'node:fs'
import {
  mergeSchemaOverrideYaml,
  OVERRIDE_YAML_PATTERN,
  resolveSchemaOverrideYamlKind,
} from './schemaOverrideYamlMerge.ts'

const run = (command: string, args: string[], options?: { allowFailure?: boolean }) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.status !== 0 && !options?.allowFailure) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    throw new Error(`${command} ${args.join(' ')} failed (${result.status}): ${details}`)
  }
  return result
}

const runGit = (args: string[], options?: { allowFailure?: boolean }) => run('git', args, options)

const githubApi = async <T>(token: string, path: string): Promise<T> => {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`)
  }
  return response.json() as Promise<T>
}

const listPullRequestOverrideFiles = async ({
  token,
  repository,
  pullNumber,
}: {
  token: string
  repository: string
  pullNumber: number
}) => {
  const files = await githubApi<{ filename: string }[]>(
    token,
    `/repos/${repository}/pulls/${pullNumber}/files?per_page=100`,
  )
  return files
    .map((file) => file.filename)
    .filter((filename) => OVERRIDE_YAML_PATTERN.test(filename))
}

const readGitFile = (revision: string, filename: string) => {
  const result = runGit(['show', `${revision}:${filename}`], { allowFailure: true })
  if (result.status !== 0) return null
  return result.stdout
}

const listConflictedFiles = () =>
  runGit(['diff', '--name-only', '--diff-filter=U'], { allowFailure: true })
    .stdout.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const isRebaseInProgress = () => {
  const gitDir = runGit(['rev-parse', '--git-path', 'rebase-merge']).stdout.trim()
  return existsSync(gitDir)
}

const resolveOverrideConflict = (filename: string) => {
  const baseContent = readGitFile(':2', filename)
  const branchContent = readGitFile(':3', filename)
  if (!baseContent || !branchContent) {
    throw new Error(`Missing merge stages for ${filename}`)
  }
  const merged = mergeSchemaOverrideYaml({ filename, baseContent, branchContent })
  writeFileSync(filename, merged, 'utf8')
  runGit(['add', filename])
}

const finishRebaseWithConflictResolution = (overrideFiles: string[]) => {
  while (isRebaseInProgress()) {
    const conflicted = listConflictedFiles()
    if (conflicted.length === 0) {
      throw new Error('Rebase stopped without conflict markers')
    }

    const unexpected = conflicted.filter((filename) => !overrideFiles.includes(filename))
    if (unexpected.length > 0) {
      runGit(['rebase', '--abort'], { allowFailure: true })
      throw new Error(`Cannot auto-resolve conflicts in: ${unexpected.join(', ')}`)
    }

    for (const filename of conflicted) {
      resolveOverrideConflict(filename)
    }

    const continued = runGit(['-c', 'core.editor=true', 'rebase', '--continue'], {
      allowFailure: true,
    })
    if (continued.status !== 0 && listConflictedFiles().length > 0) {
      continue
    }
    if (continued.status !== 0) {
      runGit(['rebase', '--abort'], { allowFailure: true })
      throw new Error(`Rebase continue failed: ${[continued.stdout, continued.stderr].join('\n')}`)
    }
  }
}

export const rebaseSchemaOverridePullRequest = async ({
  token,
  repository,
  pullNumber,
}: {
  token: string
  repository: string
  pullNumber: number
}) => {
  const pull = await githubApi<{
    head: { ref: string; sha: string }
    mergeable: boolean | null
    mergeable_state: string
  }>(token, `/repos/${repository}/pulls/${pullNumber}`)

  const overrideFiles = await listPullRequestOverrideFiles({ token, repository, pullNumber })
  if (overrideFiles.length === 0) {
    return { rebased: false, pushed: false, reason: 'no-override-files' as const }
  }

  for (const filename of overrideFiles) {
    if (!resolveSchemaOverrideYamlKind(filename)) {
      throw new Error(`Unsupported override file in PR #${pullNumber}: ${filename}`)
    }
  }

  runGit(['fetch', 'origin', 'main', pull.head.ref])
  runGit(['checkout', pull.head.ref])
  runGit(['config', 'user.name', 'github-actions[bot]'])
  runGit(['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'])

  const beforeSha = runGit(['rev-parse', 'HEAD']).stdout.trim()
  const needsRebase =
    pull.mergeable === false ||
    pull.mergeable_state === 'dirty' ||
    runGit(['merge-base', '--is-ancestor', 'origin/main', 'HEAD'], { allowFailure: true })
      .status !== 0

  if (!needsRebase) {
    return { rebased: false, pushed: false, reason: 'already-up-to-date' as const }
  }

  const rebase = runGit(['rebase', 'origin/main'], { allowFailure: true })
  if (rebase.status !== 0) {
    finishRebaseWithConflictResolution(overrideFiles)
  }

  const afterSha = runGit(['rev-parse', 'HEAD']).stdout.trim()
  if (beforeSha === afterSha) {
    return { rebased: false, pushed: false, reason: 'already-up-to-date' as const }
  }

  runGit(['push', '--force-with-lease', 'origin', `HEAD:${pull.head.ref}`])

  return { rebased: true, pushed: true, reason: 'rebased' as const }
}

const runFromGitHubActions = async () => {
  const token = process.env.GITHUB_TOKEN
  const repository = process.env.GITHUB_REPOSITORY
  const pullNumber = Number.parseInt(process.env.PR_NUMBER ?? '', 10)

  if (!token) throw new Error('GITHUB_TOKEN is required')
  if (!repository) throw new Error('GITHUB_REPOSITORY is required')
  if (!Number.isFinite(pullNumber)) throw new Error('PR_NUMBER is required')

  const result = await rebaseSchemaOverridePullRequest({ token, repository, pullNumber })
  console.log(JSON.stringify(result))

  const githubOutputPath = process.env.GITHUB_OUTPUT
  if (githubOutputPath) {
    await Bun.write(githubOutputPath, `reason=${result.reason}\npushed=${result.pushed}\n`)
  }
}

if (import.meta.main) {
  await runFromGitHubActions()
}
