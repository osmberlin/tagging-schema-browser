import { describe, expect, it } from 'vitest'
import {
  buildCursorTriggerCommentBody,
  hasExistingCursorTrigger,
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

  it('falls back to schema-override prefix', () => {
    expect(resolveActiveKindFromTitle('[schema-override] custom title')).toBe('schema-override')
    expect(resolveActiveKindFromTitle('missing-inheritance] no bracket')).toBeNull()
  })

  it('parses source branch from issue body', () => {
    expect(resolveSourceBranch('**Source branch:** `feature/foo`')).toBe('feature/foo')
    expect(resolveSourceBranch('no branch here')).toBe('main')
  })

  it('skips when trigger comment already exists', () => {
    expect(
      hasExistingCursorTrigger([
        { body: '@cursor repo=osmberlin/tagging-schema-browser branch=main' },
      ]),
    ).toBe(true)
    expect(hasExistingCursorTrigger([{ body: 'hello' }])).toBe(false)
  })

  it('builds trigger comment with skill and schema-override label', () => {
    const body = buildCursorTriggerCommentBody({
      owner: 'osmberlin',
      repo: 'tagging-schema-browser',
      issueNumber: 138,
      activeKind: 'missing-inheritance',
      issueBody: '**Source branch:** `main`',
    })

    expect(body).toContain('@cursor repo=osmberlin/tagging-schema-browser branch=main')
    expect(body).toContain('.agents/skills/apply-schema-override/SKILL.md')
    expect(body).toContain('Closes #138')
    expect(body).toContain('schema-override')
    expect(body).toContain('[missing-inheritance]')
  })
})
