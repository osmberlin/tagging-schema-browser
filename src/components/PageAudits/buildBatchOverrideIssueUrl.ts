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
  formatMissingInheritanceOverrideYamlListScopedFromStored,
  type FieldListKey,
  type MissingFieldInheritance,
  type MissingInheritanceOverride,
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

function mergeMissingFieldInheritance(
  left: MissingFieldInheritance,
  right: MissingFieldInheritance,
): MissingFieldInheritance {
  return {
    fields: right.fields ?? left.fields,
    moreFields: right.moreFields ?? left.moreFields,
  }
}

function intentionalSnapshotYamlBlocks(entries: AuditEntry[]): string[] {
  const byPreset = new Map<string, MissingFieldInheritance>()
  const riskyYaml: string[] = []

  for (const entry of entries) {
    if (entry.kind === 'missing-inheritance') {
      const current = missingInheritanceFromEntry(entry)
      if (!current) continue
      const existing = byPreset.get(entry.presetId) ?? {}
      byPreset.set(entry.presetId, mergeMissingFieldInheritance(existing, current))
      continue
    }
    if (!entry.riskyTypeCombo) continue
    riskyYaml.push(formatRiskyTypeComboOverrideYaml(entry.presetId, entry.riskyTypeCombo))
  }

  const missingYaml = [...byPreset.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([presetId, current]) => formatMissingInheritanceOverrideYaml(presetId, current))

  return [...missingYaml, ...riskyYaml]
}

function staleOverrideYamlBlocks(entries: AuditEntry[]): string[] {
  const staleListKeysByPreset = new Map<string, Set<FieldListKey>>()
  const storedOverrideByPreset = new Map<string, MissingInheritanceOverride>()
  const riskyYaml: string[] = []

  for (const entry of entries) {
    if (!entry.storedOverride) continue
    if (entry.kind === 'missing-inheritance') {
      const listKeys = staleListKeysByPreset.get(entry.presetId) ?? new Set<FieldListKey>()
      listKeys.add(entry.fieldListKey)
      staleListKeysByPreset.set(entry.presetId, listKeys)
      storedOverrideByPreset.set(entry.presetId, entry.storedOverride)
      continue
    }
    riskyYaml.push(formatRiskyTypeComboOverrideYamlFromStored(entry.presetId, entry.storedOverride))
  }

  const missingYaml = [...staleListKeysByPreset.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([presetId, fieldListKeys]) => {
      const override = storedOverrideByPreset.get(presetId)
      if (!override) return ''
      return formatMissingInheritanceOverrideYamlListScopedFromStored(presetId, override, [
        ...fieldListKeys,
      ])
    })
    .filter((block) => block.length > 0)

  return [...missingYaml, ...riskyYaml]
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

function entryContributesToIssue(entry: AuditEntry, decision: AuditDecision): boolean {
  if (decision === 'needs_work') return true
  if (decision === 'intentional') {
    if (entry.kind === 'missing-inheritance') return missingInheritanceFromEntry(entry) !== null
    return Boolean(entry.riskyTypeCombo)
  }
  if (decision === 'remove_stale') return Boolean(entry.storedOverride)
  return false
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
  const selected = entries.filter((entry) => {
    const decision = decisions[entry.entryId] ?? 'pending'
    return auditDecisionIncludesIssue(decision) && entryContributesToIssue(entry, decision)
  })

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

  const intentionalYaml = intentionalSnapshotYamlBlocks(intentionalEntries)

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

  const staleYaml = staleOverrideYamlBlocks(staleEntries)

  const staleSection =
    staleYaml.length > 0
      ? [
          '## Remove stale overrides',
          '',
          'Delete only the listed list keys (`fields` / `moreFields`) under these presets. Remove the preset key if no lists remain (live detection no longer applies):',
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
