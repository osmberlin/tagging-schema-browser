import { describe, expect, it } from 'vitest'
import {
  buildDocumentTitle,
  documentDetailTitleHead,
  documentReferenceSegment,
  documentTitleHead,
} from '@/utils/documentTitle'

describe('documentReferenceSegment', () => {
  it('uses Release when reference=release', () => {
    expect(documentReferenceSegment({ reference: 'release' })).toBe('Release')
  })

  it('uses Unreleased for interem or missing reference', () => {
    expect(documentReferenceSegment({ reference: 'interem' })).toBe('Unreleased')
    expect(documentReferenceSegment({})).toBe('Unreleased')
  })
})

describe('buildDocumentTitle', () => {
  it('formats page, app, and reference segments', () => {
    expect(buildDocumentTitle('Presets', 'Unreleased')).toBe(
      'Presets - Tagging Schema Browser - Unreleased',
    )
    expect(buildDocumentTitle('Icons', 'Release')).toBe('Icons - Tagging Schema Browser - Release')
  })
})

describe('documentTitleHead', () => {
  it('reads reference from the root match search', () => {
    const head = documentTitleHead('Fields')({
      matches: [{ search: { reference: 'release' } }],
    })
    expect(head.meta?.[0]?.title).toBe('Fields - Tagging Schema Browser - Release')
  })
})

describe('documentDetailTitleHead', () => {
  it('includes the entity id from route params', () => {
    const head = documentDetailTitleHead('Field')({
      matches: [{ search: {} }],
      params: { _splat: 'shop' },
    })
    expect(head.meta?.[0]?.title).toBe('shop Field - Tagging Schema Browser - Unreleased')
  })

  it('falls back to the page name when the splat param is missing', () => {
    const head = documentDetailTitleHead('Field')({
      matches: [{ search: { reference: 'release' } }],
      params: {},
    })
    expect(head.meta?.[0]?.title).toBe('Field - Tagging Schema Browser - Release')
  })
})
