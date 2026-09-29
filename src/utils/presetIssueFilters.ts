import type { SearchState } from '@/components/PagePresets/useSearchState'

export type PresetIssueFilterKey = 'brokenIcon' | 'iconMismatch'

export function activePresetIssueFilter(state: SearchState): PresetIssueFilterKey | null {
  if (state.hasIcon.includes('broken')) return 'brokenIcon'
  if (state.iconMismatch.includes('mismatch')) return 'iconMismatch'
  return null
}

export function showPresetIssueAlert(
  active: PresetIssueFilterKey | null,
  issue: PresetIssueFilterKey,
): boolean {
  return active === null || active === issue
}
