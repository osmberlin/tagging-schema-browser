import type { FieldDecision } from '@/components/PageAudits/auditDecisions'
import type { AuditEntry } from '@/components/PageAudits/auditEntries'
import {
  auditPageAbsoluteHref,
  fieldDetailAbsoluteHref,
  presetDetailAbsoluteHref,
} from '@/components/PageAudits/auditPageHref'
import { AUDIT_META, type AuditSlug } from '@/components/PageAudits/auditSlugs'
import {
  collectAuditDecisions,
  collectLabelMismatchDecisions,
  formatOverrideChangeBlock,
  type LabelMismatchChange,
  type NeedsWorkEntry,
  type OverrideChange,
  type OverrideChangeSet,
} from '@/components/PageAudits/overrideChanges'
import { GITHUB_REPO_URL } from '@/utils/constants'

/** Conservative limit for `issues/new?…` query strings in common browsers. */
export const ISSUE_URL_MAX_LENGTH = 7500

function changeLabel(change: { presetId: string; listKey?: string }): string {
  return change.listKey ? `${change.presetId} (${change.listKey})` : change.presetId
}

function changeLine(change: OverrideChange, dataUrl: string): string {
  const parts = [
    change.add.length > 0 ? `OK to skip: ${change.add.map((id) => `\`${id}\``).join(', ')}` : '',
    change.remove.length > 0 ? `remove: ${change.remove.map((id) => `\`${id}\``).join(', ')}` : '',
  ].filter(Boolean)
  return `- [\`${changeLabel(change)}\`](${presetDetailAbsoluteHref(change.presetId, dataUrl)}) — ${parts.join('; ')}`
}

function codeList(ids: string[]): string {
  return ids.map((id) => `\`${id}\``).join(', ')
}

function labelChangeLine(change: LabelMismatchChange, dataUrl: string): string {
  const parts = [
    change.add.length > 0 ? `OK to skip: ${codeList(change.add.map(([option]) => option))}` : '',
    change.remove.length > 0 ? `remove: ${codeList(change.remove.map(([option]) => option))}` : '',
  ].filter(Boolean)
  return `- [\`${change.fieldId}\`](${fieldDetailAbsoluteHref(change.fieldId, dataUrl)}) — ${parts.join('; ')}`
}

function labelNeedsWorkLines({ entry, fieldIds }: NeedsWorkEntry, dataUrl: string): string[] {
  return entry.fields
    .filter((item) => fieldIds.includes(item.fieldId) && item.labelPair)
    .map(({ labelPair }) => {
      const pair = labelPair!
      return `- \`${entry.optionFieldId}\` option \`${pair.optionValue}\` “${pair.optionLabel}” ≠ [${pair.childPresetName}](${presetDetailAbsoluteHref(pair.childPresetId, dataUrl)}) (\`${pair.childPresetId}\`)`
    })
}

/** Decisions of one audit page as issue sections: what changes in the override, what is upstream work. */
function issueSections(
  slug: AuditSlug,
  entries: AuditEntry[],
  decisions: Record<string, FieldDecision | undefined>,
  dataUrl: string,
): {
  changeSet: OverrideChangeSet | null
  changeLines: string[]
  upstreamLines: string[]
  subject: string
} {
  const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

  if (slug === 'label-mismatch') {
    const { changes, needsWork } = collectLabelMismatchDecisions(entries, decisions)
    const upstreamLines = needsWork.flatMap((item) => labelNeedsWorkLines(item, dataUrl))
    const optionCount =
      changes.reduce((sum, change) => sum + change.add.length + change.remove.length, 0) +
      upstreamLines.length
    return {
      changeSet: changes.length > 0 ? { version: 1, kind: slug, changes } : null,
      changeLines: changes.map((change) => labelChangeLine(change, dataUrl)),
      upstreamLines,
      subject: plural(optionCount, 'option'),
    }
  }

  const { changes, needsWork } = collectAuditDecisions(entries, decisions)
  const presetCount = new Set([
    ...changes.map((change) => change.presetId),
    ...needsWork.map(({ entry }) => entry.presetId),
  ]).size
  return {
    changeSet: changes.length > 0 ? { version: 1, kind: slug, changes } : null,
    changeLines: changes.map((change) => changeLine(change, dataUrl)),
    upstreamLines: needsWork.map(
      ({ entry, fieldIds }) =>
        `- [\`${changeLabel(entry)}\`](${presetDetailAbsoluteHref(entry.presetId, dataUrl)}) — ${codeList(fieldIds)}`,
    ),
    subject: plural(presetCount, 'preset'),
  }
}

export function buildBatchSchemaOverrideIssueUrl({
  slug,
  entries,
  decisions,
  dataUrl,
  reference,
}: {
  slug: AuditSlug
  entries: AuditEntry[]
  decisions: Record<string, FieldDecision | undefined>
  dataUrl: string
  reference?: 'release' | 'interim'
}): string {
  const { changeSet, changeLines, upstreamLines, subject } = issueSections(
    slug,
    entries,
    decisions,
    dataUrl,
  )
  if (changeLines.length === 0 && upstreamLines.length === 0) {
    throw new Error('Decide at least one field to include in the issue.')
  }

  const title = `[${slug}] audit review (${subject})`

  const body = [
    `Decisions from the Tagging Schema Browser **${AUDIT_META[slug].title}** audit.`,
    changeSet
      ? `Submitting this issue runs the **Schema override PR** workflow, which applies the block below to \`${AUDIT_META[slug].overrideFile}\` and opens a PR.`
      : 'Nothing to change in the override file — tracking only.',
    '',
    `Audit: ${auditPageAbsoluteHref({ slug, dataUrl, reference })}`,
    // Backticks keep GitHub from auto-linking the schema dist folder (it is not a browsable page).
    `Schema: \`${dataUrl.trim() || reference || 'release'}\``,
    '',
    ...(changeSet ? ['## Override changes', '', ...changeLines, ''] : []),
    ...(upstreamLines.length > 0
      ? ['## Fix upstream in id-tagging-schema', '', ...upstreamLines, '']
      : []),
    ...(changeSet
      ? [
          '<details><summary>Machine-readable changes (do not edit unless you know what you do)</summary>',
          '',
          formatOverrideChangeBlock(changeSet),
          '',
          '</details>',
        ]
      : []),
  ].join('\n')

  const params = new URLSearchParams({ title, body })
  const url = `${GITHUB_REPO_URL}/issues/new?${params.toString()}`
  if (url.length > ISSUE_URL_MAX_LENGTH) {
    throw new Error(
      `Issue URL is too long (${url.length} > ${ISSUE_URL_MAX_LENGTH} characters). Decide fewer fields per issue.`,
    )
  }
  return url
}

/** Non-throwing variant so the UI can warn about an over-long issue before submit. */
export function tryBuildBatchSchemaOverrideIssueUrl(
  args: Parameters<typeof buildBatchSchemaOverrideIssueUrl>[0],
): { url: string } | { error: string } {
  try {
    return { url: buildBatchSchemaOverrideIssueUrl(args) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not build issue URL.' }
  }
}
