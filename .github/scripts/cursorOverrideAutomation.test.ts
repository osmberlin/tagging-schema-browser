import { describe, expect, it, vi } from 'vitest'
import {
  buildCursorTriggerCommentBody,
  hasExistingCursorTrigger,
  hasLegacyBrokenCursorTrigger,
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

  it('skips when a working trigger comment already exists', () => {
    expect(
      hasExistingCursorTrigger([
        { body: '@cursoragent look into this issue. Apply override for #138.' },
      ]),
    ).toBe(true)
    expect(hasExistingCursorTrigger([{ body: 'hello' }])).toBe(false)
  })

  it('detects legacy broken trigger comments', () => {
    expect(
      hasLegacyBrokenCursorTrigger([
        { body: '@cursor repo=osmberlin/tagging-schema-browser branch=main' },
      ]),
    ).toBe(true)
    expect(
      hasLegacyBrokenCursorTrigger([
        { body: '@cursoragent repo=osmberlin/tagging-schema-browser branch=main' },
      ]),
    ).toBe(true)
    expect(hasLegacyBrokenCursorTrigger([{ body: '@cursoragent look into this issue' }])).toBe(
      false,
    )
  })

  it('builds trigger comment with @cursoragent natural language and skill', () => {
    const body = buildCursorTriggerCommentBody({
      owner: 'osmberlin',
      repo: 'tagging-schema-browser',
      issueNumber: 138,
      activeKind: 'missing-inheritance',
      issueBody: '**Source branch:** `main`',
    })

    expect(body).toContain('@cursoragent look into this issue')
    expect(body).not.toContain('@cursor repo=')
    expect(body).not.toContain('repo=osmberlin/tagging-schema-browser')
    expect(body).toContain('Work in `osmberlin/tagging-schema-browser` on branch `main`')
    expect(body).toContain('.agents/skills/apply-schema-override/SKILL.md')
    expect(body).toContain('Open a PR ready for review (not draft)')
    expect(body).toContain('Closes #138')
    expect(body).toContain('schema-override')
    expect(body).toContain('[missing-inheritance]')
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

  it('restarts triggers for override issues without open PRs', async () => {
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
          JSON.stringify([{ number: 151, title: '[missing-inheritance] foo', body: '' }]),
          { status: 200 },
        )
      }

      if (url.includes('/pulls?state=open')) {
        return new Response(JSON.stringify([]), { status: 200 })
      }

      if (url.includes('/issues/151/comments') && method === 'GET') {
        return new Response(
          JSON.stringify([{ body: '@cursor repo=osmberlin/tagging-schema-browser' }]),
          {
            status: 200,
          },
        )
      }

      if (url.includes('/issues/151/comments') && method === 'POST') {
        return new Response(JSON.stringify({ id: 1 }), { status: 201 })
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`)
    })

    await restartSchemaOverrideIssues({
      token: 'token',
      repository: 'osmberlin/tagging-schema-browser',
    })

    const postCall = fetchMock.mock.calls.find(
      ([url, init]) => requestUrl(url).includes('/issues/151/comments') && init?.method === 'POST',
    )
    expect(postCall).toBeTruthy()
    const requestBody = postCall?.[1]?.body
    expect(typeof requestBody).toBe('string')
    const body = JSON.parse(requestBody as string)
    expect(body.body).toContain('@cursoragent look into this issue')

    fetchMock.mockRestore()
  })
})
