import type { SearchState } from '@/components/PagePresets/useSearchState'

export type PresetIssueFilterKey = 'brokenIcon' | 'iconMismatch' | 'missingInheritance'

export function activePresetIssueFilter(state: SearchState): PresetIssueFilterKey | null {
  if (state.hasIcon.includes('broken')) return 'brokenIcon'
  if (state.iconMismatch.includes('mismatch')) return 'iconMismatch'
  if (state.missingInheritance.length > 0) return 'missingInheritance'
  return null
}

export function showPresetIssueAlert(
  active: PresetIssueFilterKey | null,
  issue: PresetIssueFilterKey,
): boolean {
  return active === null || active === issue
}
