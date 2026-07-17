import { describe, expect, it } from 'vitest'
import {
  buildCursorTriggerCommentBody,
  hasExistingCursorTrigger,
  hasLegacyBrokenCursorTrigger,
  resolveActiveKindFromTitle,
  resolveSourceBranch,
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
    expect(body).toContain('Closes #138')
    expect(body).toContain('schema-override')
    expect(body).toContain('[missing-inheritance]')
  })
})
