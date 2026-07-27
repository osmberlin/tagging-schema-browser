export type AuditDecision = 'pending' | 'intentional' | 'remove_stale' | 'needs_work'

export const AUDIT_DECISION_LABELS: Record<AuditDecision, string> = {
  pending: 'Unreviewed',
  intentional: 'False positive',
  remove_stale: 'Delete outdated override',
  needs_work: 'Needs upstream work',
}

export const AUDIT_DECISION_SHORT_LABELS: Record<Exclude<AuditDecision, 'pending'>, string> = {
  intentional: 'False positive',
  remove_stale: 'Delete outdated override',
  needs_work: 'Upstream work',
}

export const AUDIT_DECISION_HELP: Record<Exclude<AuditDecision, 'pending'>, string> = {
  intentional:
    'Document the remaining missing fields as intentional skips (merges with any ids already in the override). Edit the issue body after opening if you only want a subset.',
  remove_stale:
    'Remove the stored override for this list from YAML — it documents fields that are no longer missing on the live preset. Sibling lists on the same preset are kept.',
  needs_work: 'Track in the issue only — fix in id-tagging-schema, not overrides.',
}

export function auditDecisionIncludesIssue(decision: AuditDecision): boolean {
  return decision === 'intentional' || decision === 'remove_stale' || decision === 'needs_work'
}

export function countAuditDecisionsForIssue(decisions: Record<string, AuditDecision>): number {
  return Object.values(decisions).filter(auditDecisionIncludesIssue).length
}
