import { describe, expect, it } from 'vitest'
import {
  buildCursorTriggerCommentBody,
  CURSOR_TRIGGER_MARKER,
  hasExistingCursorTrigger,
  resolveActiveLabel,
} from '../../.github/scripts/cursorOverrideAutomation.ts'

describe('resolveActiveLabel', () => {
  it('prefers kind-specific labels', () => {
    expect(resolveActiveLabel(['cursor-override', 'missing-inheritance-override'])).toBe(
      'missing-inheritance-override',
    )
    expect(resolveActiveLabel(['risky-typecombo-override'])).toBe('risky-typecombo-override')
  })

  it('returns null when no kind label is present', () => {
    expect(resolveActiveLabel(['cursor-override'])).toBeNull()
  })
})

describe('hasExistingCursorTrigger', () => {
  it('detects an existing @cursor comment', () => {
    expect(
      hasExistingCursorTrigger([
        { body: `${CURSOR_TRIGGER_MARKER}osmberlin/tagging-schema-browser` },
      ]),
    ).toBe(true)
    expect(hasExistingCursorTrigger([{ body: 'hello' }])).toBe(false)
  })
})

describe('buildCursorTriggerCommentBody', () => {
  it('includes repo, skill path, and Closes instruction', () => {
    const body = buildCursorTriggerCommentBody({
      owner: 'osmberlin',
      repo: 'tagging-schema-browser',
      issueNumber: 138,
      activeLabel: 'missing-inheritance-override',
    })

    expect(body).toContain('@cursor repo=osmberlin/tagging-schema-browser branch=main')
    expect(body).toContain('apply-schema-override/SKILL.md')
    expect(body).toContain('schema-override')
    expect(body).toContain('Closes #138')
    expect(body).toContain('missing-inheritance')
  })
})
