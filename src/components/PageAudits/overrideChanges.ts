/**
 * Machine-readable override changes shared by the audit page (writes them into the GitHub issue)
 * and `.github/scripts/applyOverrideIssue.ts` (applies them to the YAML files and opens a PR).
 * Keep imports relative and type-only so the script runs in Bun without the app.
 */
import type { FieldListKey } from '../PagePresets/missingFieldInheritance'
import { fieldDecisionKey, type FieldDecision } from './auditDecisions'
import type { AuditEntry } from './auditEntries'
import type { AuditSlug } from './auditSlugs'

export type OverrideChange = {
  presetId: string
  /** Missing inheritance only. */
  listKey?: FieldListKey
  /** Missing inheritance only. */
  parentId?: string
  add: string[]
  remove: string[]
}

export type OverrideChangeSet = {
  version: 1
  kind: AuditSlug
  changes: OverrideChange[]
}

export type NeedsWorkEntry = { entry: AuditEntry; fieldIds: string[] }

export function collectAuditDecisions(
  entries: AuditEntry[],
  decisions: Record<string, FieldDecision | undefined>,
): { changes: OverrideChange[]; needsWork: NeedsWorkEntry[] } {
  const changes: OverrideChange[] = []
  const needsWork: NeedsWorkEntry[] = []

  for (const entry of entries) {
    const byDecision = (decision: FieldDecision) =>
      entry.fields
        .filter((field) => decisions[fieldDecisionKey(entry.entryId, field.fieldId)] === decision)
        .map((field) => field.fieldId)
    const add = byDecision('intentional')
    const remove = byDecision('remove')
    const upstream = byDecision('needs_work')

    if (add.length > 0 || remove.length > 0) {
      changes.push({
        presetId: entry.presetId,
        ...(entry.listKey ? { listKey: entry.listKey, parentId: entry.parentId } : {}),
        add,
        remove,
      })
    }
    if (upstream.length > 0) needsWork.push({ entry, fieldIds: upstream })
  }

  return { changes, needsWork }
}

// --- Issue body block ---------------------------------------------------------

const BLOCK_INFO = 'json override-changes'
const BLOCK_PATTERN = /```json override-changes\s*\n([\s\S]*?)\n```/

export function formatOverrideChangeBlock(changeSet: OverrideChangeSet): string {
  return ['```' + BLOCK_INFO, JSON.stringify(changeSet, null, 1), '```'].join('\n')
}

const ID_PATTERN = /^[\w.:/-]+$/

function isIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === 'string' && ID_PATTERN.test(id))
}

/** Parse and strictly validate the change block from an issue body. Throws on anything unexpected. */
export function parseOverrideChangeBlock(body: string): OverrideChangeSet {
  const match = body.match(BLOCK_PATTERN)
  if (!match?.[1]) throw new Error('No ```json override-changes block found in the issue body.')
  const data = JSON.parse(match[1]) as Partial<OverrideChangeSet>

  if (data.version !== 1) throw new Error('override-changes: expected version 1')
  if (data.kind !== 'missing-inheritance' && data.kind !== 'risky-typecombo') {
    throw new Error(`override-changes: unknown kind ${String(data.kind)}`)
  }
  if (!Array.isArray(data.changes) || data.changes.length === 0) {
    throw new Error('override-changes: no changes')
  }
  for (const change of data.changes) {
    const valid =
      typeof change.presetId === 'string' &&
      ID_PATTERN.test(change.presetId) &&
      isIdList(change.add) &&
      isIdList(change.remove) &&
      (data.kind === 'risky-typecombo' ||
        ((change.listKey === 'fields' || change.listKey === 'moreFields') &&
          typeof change.parentId === 'string' &&
          ID_PATTERN.test(change.parentId)))
    if (!valid) throw new Error(`override-changes: invalid change ${JSON.stringify(change)}`)
  }
  return data as OverrideChangeSet
}

// --- Apply to override files ------------------------------------------------

type MissingInheritancePresets = Record<
  string,
  Partial<Record<FieldListKey, { parentId: string; missedFieldIds: string[] }>>
>
type RiskyTypeComboPresets = Record<string, { fieldIds: string[] }>

/** Keeps the existing order (small PR diffs); new ids are appended. */
function applyIds(existing: string[], change: OverrideChange): string[] {
  const ids = new Set(existing)
  for (const id of change.remove) ids.delete(id)
  for (const id of change.add) ids.add(id)
  return [...ids]
}

export function applyMissingInheritanceChanges(
  presets: MissingInheritancePresets,
  changes: OverrideChange[],
): MissingInheritancePresets {
  const next = structuredClone(presets)
  for (const change of changes) {
    const listKey = change.listKey!
    const parentId = change.parentId!
    const preset = next[change.presetId] ?? {}
    const list = preset[listKey]
    // A parent change invalidates the old list entirely.
    const existing = list && list.parentId === parentId ? list.missedFieldIds : []
    const ids = applyIds(existing, change)
    if (ids.length > 0) preset[listKey] = { parentId, missedFieldIds: ids }
    else delete preset[listKey]
    if (Object.keys(preset).length > 0) next[change.presetId] = preset
    else delete next[change.presetId]
  }
  return next
}

export function applyRiskyTypeComboChanges(
  presets: RiskyTypeComboPresets,
  changes: OverrideChange[],
): RiskyTypeComboPresets {
  const next = structuredClone(presets)
  for (const change of changes) {
    const ids = applyIds(next[change.presetId]?.fieldIds ?? [], change)
    if (ids.length > 0) next[change.presetId] = { fieldIds: ids }
    else delete next[change.presetId]
  }
  return next
}

// --- YAML serialization (keeps the file's leading comment block) --------------

function yamlDocument(header: string, presetBlocks: string[]): string {
  const body = presetBlocks.length > 0 ? `presets:\n${presetBlocks.join('')}` : 'presets: {}\n'
  return `${header}version: 1\n${body}`
}

/** Everything before the `version:` line (the documentation comments). */
export function yamlHeader(fileContent: string): string {
  const index = fileContent.search(/^version:/m)
  return index > 0 ? fileContent.slice(0, index) : ''
}

export function serializeMissingInheritanceYaml(
  header: string,
  presets: MissingInheritancePresets,
): string {
  // Insertion order: existing presets keep their place, new ones are appended.
  const blocks = Object.keys(presets).map((presetId) => {
    const lines = [`  ${presetId}:`]
    for (const listKey of ['fields', 'moreFields'] as const) {
      const list = presets[presetId]?.[listKey]
      if (!list) continue
      lines.push(`    ${listKey}:`, `      parentId: ${list.parentId}`, '      missedFieldIds:')
      lines.push(...list.missedFieldIds.map((id) => `        - ${id}`))
    }
    return `${lines.join('\n')}\n`
  })
  return yamlDocument(header, blocks)
}

export function serializeRiskyTypeComboYaml(
  header: string,
  presets: RiskyTypeComboPresets,
): string {
  const blocks = Object.keys(presets).map((presetId) =>
    [`  ${presetId}:`, '    fieldIds:', ...presets[presetId]!.fieldIds.map((id) => `      - ${id}`)]
      .join('\n')
      .concat('\n'),
  )
  return yamlDocument(header, blocks)
}
