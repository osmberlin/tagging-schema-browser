import { describe, expect, it } from 'vitest'
import {
  buildCursorTriggerCommentBody,
  hasExistingCursorTrigger,
  resolveActiveLabel,
  resolveSourceBranch,
} from '../../.github/scripts/cursorOverrideAutomation.ts'

describe('cursorOverrideAutomation', () => {
  it('resolves kind-specific label over umbrella label', () => {
    expect(resolveActiveLabel(['cursor-override', 'missing-inheritance-override'])).toBe(
      'missing-inheritance-override',
    )
  })

  it('falls back to cursor-override', () => {
    expect(resolveActiveLabel(['cursor-override'])).toBe('cursor-override')
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
      activeLabel: 'missing-inheritance-override',
      issueBody: '**Source branch:** `main`',
    })

    expect(body).toContain('@cursor repo=osmberlin/tagging-schema-browser branch=main')
    expect(body).toContain('.agents/skills/apply-schema-override/SKILL.md')
    expect(body).toContain('Closes #138')
    expect(body).toContain('schema-override')
  })
})
