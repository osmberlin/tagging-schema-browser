import { describe, expect, it } from 'vitest'
import { fieldFacetDefaults } from '@/components/PageFields/useFieldFacetState'
import { activeFieldIssueFilter, showFieldIssueAlert } from '@/utils/fieldIssueFilters'

describe('fieldIssueFilters', () => {
  it('returns the active field issue facet', () => {
    expect(activeFieldIssueFilter({ ...fieldFacetDefaults, f_iconMismatch: 'mismatch' })).toBe(
      'iconMismatch',
    )
    expect(activeFieldIssueFilter({ ...fieldFacetDefaults, f_riskyTypeCombo: 'risky' })).toBe(
      'riskyTypeCombo',
    )
    expect(activeFieldIssueFilter(fieldFacetDefaults)).toBeNull()
  })

  it('prefers icon mismatch when both facets are active', () => {
    expect(
      activeFieldIssueFilter({
        ...fieldFacetDefaults,
        f_iconMismatch: 'mismatch',
        f_riskyTypeCombo: 'risky',
      }),
    ).toBe('iconMismatch')
  })

  it('gates banners like the presets page', () => {
    expect(showFieldIssueAlert(null, 'riskyTypeCombo')).toBe(true)
    expect(showFieldIssueAlert('riskyTypeCombo', 'riskyTypeCombo')).toBe(true)
    expect(showFieldIssueAlert('riskyTypeCombo', 'iconMismatch')).toBe(false)
  })
})
