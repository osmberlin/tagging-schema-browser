import { describe, expect, it } from 'vitest'
import { activePresetIssueFilter, showPresetIssueAlert } from '@/utils/presetIssueFilters'

const emptySearch = {
  q: '',
  page: 1,
  sort: 'name_asc' as const,
  template: 'no' as const,
  searchable: 'both' as const,
  primaryTagKey: [] as string[],
  geometry: [] as string[],
  iconPrefix: [] as string[],
  iconName: [] as string[],
  fieldIds: [] as string[],
  primaryFieldIds: [] as string[],
  moreFieldIds: [] as string[],
  categoryNames: [] as string[],
  hasIcon: [] as string[],
  iconMismatch: [] as string[],
}

describe('presetIssueFilters', () => {
  it('detects the active exclusive issue filter', () => {
    expect(activePresetIssueFilter({ ...emptySearch, hasIcon: ['broken'] })).toBe('brokenIcon')
    expect(activePresetIssueFilter({ ...emptySearch, iconMismatch: ['mismatch'] })).toBe(
      'iconMismatch',
    )
    expect(activePresetIssueFilter(emptySearch)).toBeNull()
  })

  it('shows only the active issue alert when a filter is selected', () => {
    expect(showPresetIssueAlert('brokenIcon', 'brokenIcon')).toBe(true)
    expect(showPresetIssueAlert('brokenIcon', 'iconMismatch')).toBe(false)
    expect(showPresetIssueAlert(null, 'iconMismatch')).toBe(true)
  })
})
