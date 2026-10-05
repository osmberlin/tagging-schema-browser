import type { LabelMismatchOverrideEntry, LabelMismatchOverrides } from '../../utils/labelMismatch'
/**
 * Machine-readable override changes shared by the audit page (writes them into the GitHub issue)
 * and `.github/scripts/applyOverrideIssue.ts` (applies them to the YAML files and opens a PR).
 * Keep imports relative and type-only so the script runs in Bun without the app.
 */
import type { FieldListKey } from '../PagePresets/missingFieldInheritance'
import { fieldDecisionKey, type FieldDecision } from './auditDecisions'
import type { AuditEntry } from './auditEntries'

export type OverrideChange = {
  presetId: string
  /** Missing inheritance only. */
  listKey?: FieldListKey
  /** Missing inheritance only. */
  parentId?: string
  add: string[]
  remove: string[]
}

/** Tuples keep the issue URL short; labels travel along because the override stores them. */
export type LabelMismatchChange = {
  fieldId: string
  /** `[option, preset, optionLabel, presetName]` */
  add: [string, string, string, string][]
  /** `[option, preset]` */
  remove: [string, string][]
}

export type OverrideChangeSet =
  | { version: 1; kind: 'missing-inheritance' | 'risky-typecombo'; changes: OverrideChange[] }
  | { version: 1; kind: 'label-mismatch'; changes: LabelMismatchChange[] }

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

export function collectLabelMismatchDecisions(
  entries: AuditEntry[],
  decisions: Record<string, FieldDecision | undefined>,
): { changes: LabelMismatchChange[]; needsWork: NeedsWorkEntry[] } {
  const byFieldId = new Map<string, LabelMismatchChange>()
  const needsWork: NeedsWorkEntry[] = []

  for (const entry of entries) {
    const fieldId = entry.optionFieldId!
    const upstream: string[] = []
    for (const item of entry.fields) {
      const decision = decisions[fieldDecisionKey(entry.entryId, item.fieldId)]
      const pair = item.labelPair
      if (!decision || !pair) continue
      if (decision === 'needs_work') {
        upstream.push(item.fieldId)
        continue
      }
      const change = byFieldId.get(fieldId) ?? { fieldId, add: [], remove: [] }
      byFieldId.set(fieldId, change)
      if (decision === 'intentional') {
        change.add.push([
          pair.optionValue,
          pair.childPresetId,
          pair.optionLabel,
          pair.childPresetName,
        ])
      } else {
        change.remove.push([pair.optionValue, pair.childPresetId])
      }
    }
    if (upstream.length > 0) needsWork.push({ entry, fieldIds: upstream })
  }

  return { changes: [...byFieldId.values()], needsWork }
}

// --- Issue body block ---------------------------------------------------------

const BLOCK_INFO = 'json override-changes'
const BLOCK_PATTERN = /```json override-changes\s*\n([\s\S]*?)\n```/

export function formatOverrideChangeBlock(changeSet: OverrideChangeSet): string {
  // One line per change: readable enough, and much shorter in the issue URL than pretty JSON.
  const changes = changeSet.changes.map((change) => ` ${JSON.stringify(change)}`).join(',\n')
  const head = `{"version":1,"kind":${JSON.stringify(changeSet.kind)},"changes":[`
  return ['```' + BLOCK_INFO, head, changes, ']}', '```'].join('\n')
}

const ID_PATTERN = /^[\w.:/-]+$/

function isIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id) => typeof id === 'string' && ID_PATTERN.test(id))
}

/** Option values are OSM tag values: no whitespace, quotes or control characters. */
const OPTION_PATTERN = /^[^\s"'`\\]{1,100}$/
/** English UI strings: a single line of printable text. */
const LABEL_PATTERN = /^[^\p{Cc}\p{Cf}\p{Zl}\p{Zp}]{1,200}$/u

function isTuple(value: unknown, patterns: RegExp[]): boolean {
  return (
    Array.isArray(value) &&
    value.length === patterns.length &&
    value.every((part, index) => typeof part === 'string' && patterns[index]!.test(part))
  )
}

function isLabelMismatchChange(change: Partial<LabelMismatchChange>): boolean {
  return (
    typeof change.fieldId === 'string' &&
    ID_PATTERN.test(change.fieldId) &&
    Array.isArray(change.add) &&
    Array.isArray(change.remove) &&
    change.add.every((item) =>
      isTuple(item, [OPTION_PATTERN, ID_PATTERN, LABEL_PATTERN, LABEL_PATTERN]),
    ) &&
    change.remove.every((item) => isTuple(item, [OPTION_PATTERN, ID_PATTERN]))
  )
}

/** Parse and strictly validate the change block from an issue body. Throws on anything unexpected. */
export function parseOverrideChangeBlock(body: string): OverrideChangeSet {
  const match = body.match(BLOCK_PATTERN)
  if (!match?.[1]) throw new Error('No ```json override-changes block found in the issue body.')
  const data = JSON.parse(match[1]) as {
    version?: unknown
    kind?: unknown
    changes?: Partial<OverrideChange & LabelMismatchChange>[]
  }

  if (data.version !== 1) throw new Error('override-changes: expected version 1')
  if (
    data.kind !== 'missing-inheritance' &&
    data.kind !== 'risky-typecombo' &&
    data.kind !== 'label-mismatch'
  ) {
    throw new Error(`override-changes: unknown kind ${String(data.kind)}`)
  }
  if (!Array.isArray(data.changes) || data.changes.length === 0) {
    throw new Error('override-changes: no changes')
  }
  for (const change of data.changes) {
    if (data.kind === 'label-mismatch') {
      if (isLabelMismatchChange(change)) continue
      throw new Error(`override-changes: invalid change ${JSON.stringify(change)}`)
    }
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

/** Existing entries keep their place (small PR diffs); a re-reviewed pair is replaced in place. */
export function applyLabelMismatchChanges(
  fields: LabelMismatchOverrides['fields'],
  changes: LabelMismatchChange[],
): LabelMismatchOverrides['fields'] {
  const next = structuredClone(fields)
  for (const change of changes) {
    const entries = next[change.fieldId] ?? []
    const indexOf = (option: string, preset: string) =>
      entries.findIndex((entry) => entry.option === option && entry.preset === preset)
    for (const [option, preset] of change.remove) {
      const index = indexOf(option, preset)
      if (index >= 0) entries.splice(index, 1)
    }
    for (const [option, preset, optionLabel, presetName] of change.add) {
      const entry: LabelMismatchOverrideEntry = { option, preset, optionLabel, presetName }
      const index = indexOf(option, preset)
      if (index >= 0) entries[index] = entry
      else entries.push(entry)
    }
    if (entries.length > 0) next[change.fieldId] = entries
    else delete next[change.fieldId]
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

/** Strings are written as JSON, which is valid YAML and safe for any label or option value. */
export function serializeLabelMismatchYaml(
  header: string,
  fields: LabelMismatchOverrides['fields'],
): string {
  const blocks = Object.keys(fields).map((fieldId) =>
    [
      `  ${fieldId}:`,
      ...fields[fieldId]!.flatMap((entry) => [
        `    - option: ${JSON.stringify(entry.option)}`,
        `      preset: ${entry.preset}`,
        `      optionLabel: ${JSON.stringify(entry.optionLabel)}`,
        `      presetName: ${JSON.stringify(entry.presetName)}`,
      ]),
    ]
      .join('\n')
      .concat('\n'),
  )
  const body = blocks.length > 0 ? `fields:\n${blocks.join('')}` : 'fields: {}\n'
  return `${header}version: 1\n${body}`
}
