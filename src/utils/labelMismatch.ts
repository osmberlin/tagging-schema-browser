/**
 * Field option label vs the name of the preset that option leads to.
 *
 * A mapper sees two English strings for the same concept: the option in the parent preset's
 * field (`strings.options.*`) and the name of the child preset the option switches to.
 * Keep imports type-only: `scripts/validate-label-mismatch-overrides.ts` runs this in Bun.
 */
import type { FieldOptionMismatchRow } from './types'

/**
 * `extends`: one label is the other plus extra words ("Pizza" / "Pizza Restaurant"), the usual
 * shape when a preset name repeats its feature type. `differs`: the wording itself is different
 * ("Dancing School" / "Dance School").
 */
export type LabelMismatchKind = 'differs' | 'extends'

export const LABEL_MISMATCH_KINDS = ['differs', 'extends'] as const

export type LabelMismatchOverrideEntry = {
  option: string
  preset: string
  /** Snapshot of both labels at review time; a later rename asks for a new review. */
  optionLabel: string
  presetName: string
}

export type LabelMismatchOverrides = {
  version: number
  /** Field id → reviewed option ↔ preset pairs. */
  fields: Record<string, LabelMismatchOverrideEntry[]>
}

export type LabelMismatchPair = {
  fieldId: string
  optionValue: string
  childPresetId: string
  optionLabel: string
  childPresetName: string
  kind: LabelMismatchKind
  /** Documented as intentional in the override file, with both labels unchanged since. */
  reviewed: boolean
  /** Labels the override was reviewed with, when they changed since. */
  previous?: { optionLabel: string; presetName: string }
  /** Presets whose field offers this option, sorted; the first one is used for display. */
  parentPresets: { id: string; name: string }[]
}

export type StaleLabelMismatchOverride = LabelMismatchOverrideEntry & { fieldId: string }

export function labelMismatchKey(
  fieldId: string,
  optionValue: string,
  childPresetId: string,
): string {
  return `${fieldId}\0${optionValue}\0${childPresetId}`
}

function words(label: string): string[] {
  return label
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

/** "Tickets" and "Ticket" count as the same word when looking for an extended label. */
function singular(word: string): string {
  return word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word
}

function containsRun(haystack: string[], needle: string[]): boolean {
  for (let start = 0; start + needle.length <= haystack.length; start++) {
    if (needle.every((word, offset) => word === haystack[start + offset])) return true
  }
  return false
}

/** Null when both labels read the same (case, punctuation and `&` vs `and` are ignored). */
export function classifyLabelMismatch(
  optionLabel: string | undefined,
  presetName: string | undefined,
): LabelMismatchKind | null {
  const optionWords = words(optionLabel ?? '')
  const presetWords = words(presetName ?? '')
  if (optionWords.length === 0 || presetWords.length === 0) return null
  if (optionWords.join(' ') === presetWords.join(' ')) return null

  const optionStems = optionWords.map(singular)
  const presetStems = presetWords.map(singular)
  return containsRun(presetStems, optionStems) || containsRun(optionStems, presetStems)
    ? 'extends'
    : 'differs'
}

/** Split both labels into shared leading / trailing words and the part that differs. */
export function diffLabelWords(
  left: string,
  right: string,
): { left: LabelDiffPart[]; right: LabelDiffPart[] } {
  const leftWords = left.trim().split(/\s+/)
  const rightWords = right.trim().split(/\s+/)
  const same = (a: string | undefined, b: string | undefined) =>
    a !== undefined && b !== undefined && a.toLowerCase() === b.toLowerCase()

  let prefix = 0
  while (prefix < Math.min(leftWords.length, rightWords.length)) {
    if (!same(leftWords[prefix], rightWords[prefix])) break
    prefix++
  }
  let suffix = 0
  while (suffix < Math.min(leftWords.length, rightWords.length) - prefix) {
    if (!same(leftWords.at(-1 - suffix), rightWords.at(-1 - suffix))) break
    suffix++
  }

  const parts = (all: string[]): LabelDiffPart[] =>
    [
      { text: all.slice(0, prefix).join(' '), changed: false },
      { text: all.slice(prefix, all.length - suffix).join(' '), changed: true },
      { text: all.slice(all.length - suffix).join(' '), changed: false },
    ].filter((part) => part.text.length > 0)

  return { left: parts(leftWords), right: parts(rightWords) }
}

export type LabelDiffPart = { text: string; changed: boolean }

/** Every option ↔ preset pair whose labels differ, deduplicated across parent presets. */
export function collectLabelMismatchPairs(
  rowsByFieldId: Map<string, FieldOptionMismatchRow[]>,
  overrides: LabelMismatchOverrides,
): Map<string, LabelMismatchPair> {
  const pairs = new Map<string, LabelMismatchPair>()

  for (const [fieldId, rows] of rowsByFieldId) {
    for (const row of rows) {
      if (!row.labelMismatch) continue
      const key = labelMismatchKey(fieldId, row.optionValue, row.childPreset.id)
      const existing = pairs.get(key)
      if (existing) {
        existing.parentPresets.push(row.parentPreset)
        continue
      }
      const override = overrides.fields[fieldId]?.find(
        (entry) => entry.option === row.optionValue && entry.preset === row.childPreset.id,
      )
      const reviewed =
        override?.optionLabel === row.labelEn && override.presetName === row.childPreset.name
      pairs.set(key, {
        fieldId,
        optionValue: row.optionValue,
        childPresetId: row.childPreset.id,
        optionLabel: row.labelEn,
        childPresetName: row.childPreset.name,
        kind: row.labelMismatch,
        reviewed,
        ...(override && !reviewed
          ? { previous: { optionLabel: override.optionLabel, presetName: override.presetName } }
          : {}),
        parentPresets: [row.parentPreset],
      })
    }
  }

  for (const pair of pairs.values()) {
    pair.parentPresets.sort((a, b) => a.id.localeCompare(b.id))
  }
  return pairs
}

/** Override entries whose pair no longer differs (renamed upstream, or the option lost its preset). */
export function staleLabelMismatchOverrides(
  pairs: Map<string, LabelMismatchPair>,
  overrides: LabelMismatchOverrides,
): StaleLabelMismatchOverride[] {
  return Object.entries(overrides.fields).flatMap(([fieldId, entries]) =>
    entries
      .filter((entry) => !pairs.has(labelMismatchKey(fieldId, entry.option, entry.preset)))
      .map((entry) => ({ fieldId, ...entry })),
  )
}
