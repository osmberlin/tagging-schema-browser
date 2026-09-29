/** Decision for one field of one audit row. Missing key in the decisions record = not decided. */
export type FieldDecision = 'intentional' | 'needs_work' | 'remove'

/** `missing`: live detection, not yet documented. `stale`: documented in the override but no longer detected. */
export type AuditFieldState = 'missing' | 'stale'

export const FIELD_DECISIONS_BY_STATE: Record<AuditFieldState, FieldDecision[]> = {
  missing: ['intentional', 'needs_work'],
  stale: ['remove'],
}

export const FIELD_DECISION_LABELS: Record<FieldDecision, string> = {
  intentional: 'OK to skip',
  needs_work: 'Fix upstream',
  remove: 'Remove',
}

export const FIELD_DECISION_HELP: Record<FieldDecision, string> = {
  intentional: 'False positive — record it in the override file so the audit stops reporting it.',
  needs_work: 'Real problem — listed in the issue only; fix it in id-tagging-schema.',
  remove:
    'The override lists a field that is no longer detected (e.g. id-tagging-schema fixed the preset). Remove it from the override file.',
}

export function fieldDecisionKey(entryId: string, fieldId: string): string {
  return `${entryId}::${fieldId}`
}
