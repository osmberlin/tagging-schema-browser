import type { FieldFacetState } from '@/components/PageFields/useFieldFacetState'
import type { PresetIssueFilterKey } from '@/utils/presetIssueFilters'

export type FieldIssueFilterKey = Extract<PresetIssueFilterKey, 'iconMismatch' | 'riskyTypeCombo'>

export function activeFieldIssueFilter(state: FieldFacetState): FieldIssueFilterKey | null {
  if (state.f_iconMismatch === 'mismatch') return 'iconMismatch'
  if (state.f_riskyTypeCombo === 'risky') return 'riskyTypeCombo'
  return null
}

export function showFieldIssueAlert(
  active: FieldIssueFilterKey | null,
  issue: FieldIssueFilterKey,
): boolean {
  return active === null || active === issue
}
