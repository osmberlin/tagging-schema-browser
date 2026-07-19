import { describe, expect, it } from 'vitest'
import { fieldFacetDefaults } from '@/components/PageFields/useFieldFacetState'
import { activeFieldIssueFilter, showFieldIssueAlert } from '@/utils/fieldIssueFilters'

describe('fieldIssueFilters', () => {
  it('returns the active field issue facet', () => {
    expect(activeFieldIssueFilter({ ...fieldFacetDefaults, f_iconMismatch: 'mismatch' })).toBe(
      'iconMismatch',
    )
    expect(activeFieldIssueFilter(fieldFacetDefaults)).toBeNull()
  })

  it('gates banners like the presets page', () => {
    expect(showFieldIssueAlert(null, 'iconMismatch')).toBe(true)
    expect(showFieldIssueAlert('iconMismatch', 'iconMismatch')).toBe(true)
    expect(showFieldIssueAlert('iconMismatch', 'iconMismatch')).toBe(true)
  })
})
