import type { AuditEntry } from '@/components/PageAudits/auditEntries'
import { missingInheritanceFromEntry } from '@/components/PageAudits/auditEntries'
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

export type AuditDecision = 'pending' | 'intentional' | 'remove_stale' | 'needs_work'

function auditPageUrl(slug: AuditSlug, dataUrl: string, reference?: string): string {
  if (typeof window === 'undefined') return `/audits/${slug}`
  const params = new URLSearchParams()
  if (dataUrl.trim()) params.set('dataUrl', dataUrl)
  else if (reference) params.set('reference', reference)
  const query = params.toString()
  return `${window.location.origin}${window.location.pathname.replace(/\/audits\/[^/]+$/, `/audits/${slug}`)}${query ? `?${query}` : ''}`
}

function presetDetailUrl(presetId: string, dataUrl: string): string {
  if (typeof window === 'undefined') return `/preset/${presetId}`
  const params = new URLSearchParams()
  if (dataUrl.trim()) params.set('dataUrl', dataUrl)
  const query = params.toString()
  return `${window.location.origin}/preset/${presetId}${query ? `?${query}` : ''}`
}

function snapshotYamlForEntry(entry: AuditEntry, decision: AuditDecision): string {
  if (entry.kind === 'missing-inheritance') {
    if (decision === 'remove_stale' && entry.storedOverride) {
      return formatMissingInheritanceOverrideYamlFromStored(entry.presetId, entry.storedOverride)
    }
    const current = missingInheritanceFromEntry(entry)
    if (!current || decision !== 'intentional') return ''
    return formatMissingInheritanceOverrideYaml(entry.presetId, current)
  }

  if (decision === 'remove_stale' && entry.storedOverride) {
    return formatRiskyTypeComboOverrideYamlFromStored(entry.presetId, entry.storedOverride)
  }
  if (decision !== 'intentional' || !entry.riskyTypeCombo) return ''
  return formatRiskyTypeComboOverrideYaml(entry.presetId, entry.riskyTypeCombo)
}

function entryLabel(entry: AuditEntry): string {
  if (entry.kind === 'missing-inheritance') {
    return `${entry.presetId} (${entry.fieldListKey})`
  }
  return entry.presetId
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
  reference?: string
}): string {
  const selected = entries.filter((entry) => {
    const decision = decisions[entry.entryId] ?? 'pending'
    return decision === 'intentional' || decision === 'remove_stale' || decision === 'needs_work'
  })

  if (selected.length === 0) {
    throw new Error('Select at least one entry to include in the issue.')
  }

  const overrideEntries = selected.filter((entry) => {
    const decision = decisions[entry.entryId]
    return decision === 'intentional' || decision === 'remove_stale'
  })
  const needsWorkEntries = selected.filter((entry) => decisions[entry.entryId] === 'needs_work')

  const snapshotLines = overrideEntries
    .map((entry) => snapshotYamlForEntry(entry, decisions[entry.entryId] ?? 'pending'))
    .filter((yaml) => yaml.trim().length > 0)

  const auditUrl = auditPageUrl(slug, dataUrl, reference)

  const intro = [
    'Record schema override decisions from the Tagging Schema Browser audit page.',
    `Keep the \`[${kind}]\` title prefix. Submit to enqueue a Cursor cloud agent (manual workflow) that opens one PR for all related override issues.`,
    '',
    `Audit: ${auditUrl}`,
    `Schema: ${dataUrl || reference || 'release'}`,
    '',
  ].join('\n')

  const entryLinks = selected
    .map(
      (entry) =>
        `- \`${entryLabel(entry)}\` — [preset](${presetDetailUrl(entry.presetId, dataUrl)}) · [audit row](${auditUrl}&selected=${encodeURIComponent(entry.entryId)})`,
    )
    .join('\n')

  const snapshotSection =
    snapshotLines.length > 0
      ? ['## Snapshot', '', '```yaml', 'version: 1', 'presets:', ...snapshotLines, '```', ''].join(
          '\n',
        )
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

  const firstPreset = selected[0]?.presetId ?? 'batch'
  const title =
    selected.length === 1
      ? buildSchemaOverrideIssueTitle(
          kind,
          firstPreset,
          decisions[selected[0]!.entryId] === 'remove_stale',
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
