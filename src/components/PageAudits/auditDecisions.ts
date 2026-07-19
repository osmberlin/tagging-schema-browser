export type AuditDecision = 'pending' | 'intentional' | 'remove_stale' | 'needs_work'

export const AUDIT_DECISION_LABELS: Record<AuditDecision, string> = {
  pending: 'Unreviewed',
  intentional: 'Intentional (false positive)',
  remove_stale: 'Remove stale override',
  needs_work: 'Needs upstream work',
}

export const AUDIT_DECISION_HELP: Record<Exclude<AuditDecision, 'pending'>, string> = {
  intentional: 'Record in overrides YAML — live detection will stop flagging this entry.',
  remove_stale: 'Delete the stored override entry — live detection no longer applies.',
  needs_work: 'Track in the issue only — fix in id-tagging-schema, not overrides.',
}

export function auditDecisionIncludesIssue(decision: AuditDecision): boolean {
  return decision === 'intentional' || decision === 'remove_stale' || decision === 'needs_work'
}

export function countAuditDecisionsForIssue(decisions: Record<string, AuditDecision>): number {
  return Object.values(decisions).filter(auditDecisionIncludesIssue).length
}
