import type { FieldDecision } from '@/components/PageAudits/auditDecisions'
import type { AuditEntry } from '@/components/PageAudits/auditEntries'
import {
  auditPageAbsoluteHref,
  presetDetailAbsoluteHref,
} from '@/components/PageAudits/auditPageHref'
import { AUDIT_META, type AuditSlug } from '@/components/PageAudits/auditSlugs'
import {
  collectAuditDecisions,
  formatOverrideChangeBlock,
  type OverrideChange,
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
  const { changes, needsWork } = collectAuditDecisions(entries, decisions)
  if (changes.length === 0 && needsWork.length === 0) {
    throw new Error('Decide at least one field to include in the issue.')
  }

  const presetCount = new Set([
    ...changes.map((change) => change.presetId),
    ...needsWork.map(({ entry }) => entry.presetId),
  ]).size
  const title = `[${slug}] audit review (${presetCount} preset${presetCount === 1 ? '' : 's'})`

  const body = [
    `Decisions from the Tagging Schema Browser **${AUDIT_META[slug].title}** audit.`,
    changes.length > 0
      ? `Submitting this issue runs the **Schema override PR** workflow, which applies the block below to \`${AUDIT_META[slug].overrideFile}\` and opens a PR.`
      : 'Nothing to change in the override file — tracking only.',
    '',
    `Audit: ${auditPageAbsoluteHref({ slug, dataUrl, reference })}`,
    `Schema: ${dataUrl.trim() || reference || 'release'}`,
    '',
    ...(changes.length > 0
      ? ['## Override changes', '', ...changes.map((change) => changeLine(change, dataUrl)), '']
      : []),
    ...(needsWork.length > 0
      ? [
          '## Fix upstream in id-tagging-schema',
          '',
          ...needsWork.map(
            ({ entry, fieldIds }) =>
              `- [\`${changeLabel(entry)}\`](${presetDetailAbsoluteHref(entry.presetId, dataUrl)}) — ${fieldIds.map((id) => `\`${id}\``).join(', ')}`,
          ),
          '',
        ]
      : []),
    ...(changes.length > 0
      ? [
          '<details><summary>Machine-readable changes (do not edit unless you know what you do)</summary>',
          '',
          formatOverrideChangeBlock({ version: 1, kind: slug, changes }),
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
