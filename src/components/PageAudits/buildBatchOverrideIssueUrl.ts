import {
  auditDecisionIncludesIssue,
  AUDIT_DECISION_LABELS,
  type AuditDecision,
} from '@/components/PageAudits/auditDecisions'
import type { AuditEntry } from '@/components/PageAudits/auditEntries'
import { missingInheritanceFromEntry } from '@/components/PageAudits/auditEntries'
import {
  auditPageAbsoluteHref,
  presetDetailAbsoluteHref,
} from '@/components/PageAudits/auditPageHref'
import type { AuditSlug } from '@/components/PageAudits/auditSlugs'
import {
  formatMissingInheritanceOverrideYaml,
  formatMissingInheritanceOverrideYamlFromStored,
} from '@/components/PagePresets/missingFieldInheritance'
import {
  formatRiskyTypeComboOverrideYaml,
  formatRiskyTypeComboOverrideYamlFromStored,
} from '@/components/PagePresets/riskyTypeCombo'
import {
  buildSchemaOverrideIssueTitle,
  SCHEMA_OVERRIDE_ISSUE_URL_MAX_LENGTH,
  type SchemaOverrideKind,
} from '@/utils/buildSchemaOverrideIssueUrl'
import { GITHUB_REPO_URL } from '@/utils/constants'

function intentionalSnapshotYaml(entry: AuditEntry): string {
  if (entry.kind === 'missing-inheritance') {
    const current = missingInheritanceFromEntry(entry)
    if (!current) return ''
    return formatMissingInheritanceOverrideYaml(entry.presetId, current)
  }
  if (!entry.riskyTypeCombo) return ''
  return formatRiskyTypeComboOverrideYaml(entry.presetId, entry.riskyTypeCombo)
}

function staleOverrideYaml(entry: AuditEntry): string {
  if (!entry.storedOverride) return ''
  if (entry.kind === 'missing-inheritance') {
    return formatMissingInheritanceOverrideYamlFromStored(entry.presetId, entry.storedOverride)
  }
  return formatRiskyTypeComboOverrideYamlFromStored(entry.presetId, entry.storedOverride)
}

function entryLabel(entry: AuditEntry): string {
  if (entry.kind === 'missing-inheritance') {
    return `${entry.presetId} (${entry.fieldListKey})`
  }
  return entry.presetId
}

function decisionLabelForEntry(decision: AuditDecision): string {
  return AUDIT_DECISION_LABELS[decision]
}

export function buildBatchSchemaOverrideIssueUrl({
  kind,
  slug,
  entries,
  decisions,
  dataUrl,
  reference,
}: {
  kind: SchemaOverrideKind
  slug: AuditSlug
  entries: AuditEntry[]
  decisions: Record<string, AuditDecision>
  dataUrl: string
  reference?: 'release' | 'interim'
}): string {
  const selected = entries.filter((entry) =>
    auditDecisionIncludesIssue(decisions[entry.entryId] ?? 'pending'),
  )

  if (selected.length === 0) {
    throw new Error('Select at least one entry to include in the issue.')
  }

  const intentionalEntries = selected.filter((entry) => decisions[entry.entryId] === 'intentional')
  const staleEntries = selected.filter((entry) => decisions[entry.entryId] === 'remove_stale')
  const needsWorkEntries = selected.filter((entry) => decisions[entry.entryId] === 'needs_work')

  const auditUrl = auditPageAbsoluteHref({ slug, dataUrl, reference })
  const schemaLabel = dataUrl.trim() || reference || 'release'

  const intro = [
    'Record schema override decisions from the Tagging Schema Browser audit page.',
    `Keep the \`[${kind}]\` title prefix. After submitting, run the **Cursor override automation** workflow manually to open one PR for all related override issues.`,
    '',
    `Audit: ${auditUrl}`,
    `Schema: ${schemaLabel}`,
    '',
  ].join('\n')

  const entryLinks = selected
    .map((entry) => {
      const decision = decisions[entry.entryId] ?? 'pending'
      return `- \`${entryLabel(entry)}\` — ${decisionLabelForEntry(decision)} — [preset](${presetDetailAbsoluteHref(entry.presetId, dataUrl)}) · [audit row](${auditUrl}${auditUrl.includes('?') ? '&' : '?'}selected=${encodeURIComponent(entry.entryId)})`
    })
    .join('\n')

  const intentionalYaml = intentionalEntries
    .map((entry) => intentionalSnapshotYaml(entry))
    .filter((yaml) => yaml.trim().length > 0)

  const snapshotSection =
    intentionalYaml.length > 0
      ? [
          '## Snapshot',
          '',
          'Apply these intentional overrides:',
          '',
          '```yaml',
          'version: 1',
          'presets:',
          ...intentionalYaml,
          '```',
          '',
        ].join('\n')
      : ''

  const staleYaml = staleEntries
    .map((entry) => staleOverrideYaml(entry))
    .filter((yaml) => yaml.trim().length > 0)

  const staleSection =
    staleYaml.length > 0
      ? [
          '## Remove stale overrides',
          '',
          'Delete these preset keys from the overrides file (live detection no longer applies):',
          '',
          '```yaml',
          'presets:',
          ...staleYaml,
          '```',
          '',
        ].join('\n')
      : ''

  const needsWorkSection =
    needsWorkEntries.length > 0
      ? [
          '## Needs upstream work',
          '',
          'These entries should be fixed in id-tagging-schema (not recorded as intentional overrides):',
          '',
          ...needsWorkEntries.map((entry) => `- \`${entryLabel(entry)}\``),
          '',
        ].join('\n')
      : ''

  const firstEntry = selected[0]
  const firstDecision = firstEntry ? decisions[firstEntry.entryId] : 'pending'
  const title =
    selected.length === 1
      ? firstDecision === 'needs_work'
        ? `[${kind}] ${firstEntry!.presetId} — needs upstream work`
        : buildSchemaOverrideIssueTitle(
            kind,
            firstEntry!.presetId,
            firstDecision === 'remove_stale',
          )
      : `[${kind}] batch review (${selected.length} entries)`

  const body = [
    intro,
    '**Source branch:** `main`',
    '',
    '## Entries',
    entryLinks,
    '',
    snapshotSection,
    staleSection,
    needsWorkSection,
  ]
    .filter((section) => section.length > 0)
    .join('\n')

  const params = new URLSearchParams()
  params.set('title', title)
  params.set('body', body)
  const url = `${GITHUB_REPO_URL}/issues/new?${params.toString()}`
  if (url.length > SCHEMA_OVERRIDE_ISSUE_URL_MAX_LENGTH) {
    throw new Error(
      `Batch issue URL exceeds ${SCHEMA_OVERRIDE_ISSUE_URL_MAX_LENGTH} characters (${url.length}). Select fewer entries.`,
    )
  }
  return url
}
