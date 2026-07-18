import { describe, expect, it, vi } from 'vitest'
import {
  AGENT_LAUNCHED_MARKER,
  buildAgentLaunchedCommentBody,
  buildAgentPrompt,
  ENQUEUED_LABEL,
  hasEnqueuedLabel,
  listOpenOverrideIssues,
  resolveActiveKindFromTitle,
  resolveSourceBranch,
  restartSchemaOverrideIssues,
} from '../../.github/scripts/cursorOverrideAutomation.ts'

describe('cursorOverrideAutomation', () => {
  it('resolves kind-specific title prefix over umbrella prefix', () => {
    expect(
      resolveActiveKindFromTitle('[missing-inheritance] shop/trade — intentional omission'),
    ).toBe('missing-inheritance')
    expect(resolveActiveKindFromTitle('[risky-typecombo] highway/residential')).toBe(
      'risky-typecombo',
    )
  })

  it('returns null without a known prefix', () => {
    expect(resolveActiveKindFromTitle('missing-inheritance] no bracket')).toBeNull()
  })

  it('parses source branch from issue body', () => {
    expect(resolveSourceBranch('**Source branch:** `feature/foo`')).toBe('feature/foo')
    expect(resolveSourceBranch('no branch here')).toBe('main')
  })

  it('skips when the enqueued label is already on the issue', () => {
    expect(hasEnqueuedLabel([{ name: ENQUEUED_LABEL }])).toBe(true)
    expect(hasEnqueuedLabel([{ name: 'bug' }])).toBe(false)
  })

  it('builds agent prompt with skill, issue body, and PR requirements', () => {
    const prompt = buildAgentPrompt({
      owner: 'osmberlin',
      repo: 'tagging-schema-browser',
      issueNumber: 138,
      issueTitle: '[missing-inheritance] shop/trade',
      activeKind: 'missing-inheritance',
      issueBody: '**Source branch:** `main`\nPreset: `shop/trade`',
    })

    expect(prompt).toContain('issue #138')
    expect(prompt).toContain('.agents/skills/apply-schema-override/SKILL.md')
    expect(prompt).toContain('Closes #138')
    expect(prompt).toContain('schema-override')
    expect(prompt).toContain('ready for review (not draft)')
    expect(prompt).toContain('Preset: `shop/trade`')
    expect(prompt).toContain('Base branch: main')
    expect(prompt).not.toContain('@cursoragent')
  })

  it('builds launched comment with agent URL', () => {
    const body = buildAgentLaunchedCommentBody({
      issueNumber: 138,
      agentUrl: 'https://cursor.com/agents?id=bc_abc',
    })

    expect(body).toContain(AGENT_LAUNCHED_MARKER)
    expect(body).toContain('https://cursor.com/agents?id=bc_abc')
  })

  it('lists open override issues without pull_request sidecar', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { number: 151, title: '[missing-inheritance] foo', body: '', pull_request: undefined },
          { number: 99, title: 'Other issue', body: '', pull_request: undefined },
          { number: 200, title: '[missing-inheritance] pr', body: '', pull_request: {} },
        ]),
        { status: 200 },
      ),
    )

    const issues = await listOpenOverrideIssues({
      token: 'token',
      repository: 'osmberlin/tagging-schema-browser',
    })

    expect(issues.map((issue) => issue.number)).toEqual([151])
    fetchMock.mockRestore()
  })

  it('restarts agents via Cloud Agents API for override issues without open PRs', async () => {
    const requestUrl = (input: RequestInfo | URL) => {
      if (typeof input === 'string') return input
      if (input instanceof URL) return input.href
      return input.url
    }

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = requestUrl(input)
      const method = init?.method ?? 'GET'

      if (url.includes('/issues?state=open')) {
        return new Response(
          JSON.stringify([
            { number: 151, title: '[missing-inheritance] foo', body: 'Preset: `x`', labels: [] },
          ]),
          { status: 200 },
        )
      }

      if (url.includes('/pulls?state=open')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }

      if (url.includes('/issues/151/comments') && method === 'POST') {
        return new Response(JSON.stringify({ id: 1 }), { status: 201 })
      }

      if (url === 'https://api.cursor.com/v0/agents' && method === 'POST') {
        return new Response(
          JSON.stringify({
            id: 'bc_test',
            target: { url: 'https://cursor.com/agents?id=bc_test' },
          }),
          { status: 200 },
        )
      }

      if (url.includes('/issues/151/labels') && method === 'POST') {
        return new Response(JSON.stringify([]), { status: 200 })
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`)
    })

    await restartSchemaOverrideIssues({
      githubToken: 'gh-token',
      cursorApiKey: 'cursor-key',
      repository: 'osmberlin/tagging-schema-browser',
    })

    const launchCall = fetchMock.mock.calls.find(
      ([url, init]) => url === 'https://api.cursor.com/v0/agents' && init?.method === 'POST',
    )
    expect(launchCall).toBeTruthy()
    const requestBody = launchCall?.[1]?.body
    expect(typeof requestBody).toBe('string')
    const payload = JSON.parse(requestBody as string)
    expect(payload.prompt.text).toContain('issue #151')
    expect(payload.target.autoCreatePr).toBe(true)
    expect(payload.source.repository).toBe('https://github.com/osmberlin/tagging-schema-browser')

    fetchMock.mockRestore()
  })
})
