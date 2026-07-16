import {
  type DiffEntry,
  diffOrderedListDimension,
  diffRecordDimension,
  diffScalars,
  diffUnorderedListDimension,
  normalizeStringList,
  sortedJoin,
} from '@/utils/jsonDiff'
import type {
  DenormalizedPreset,
  RawCategories,
  RawPreset,
  RawTranslations,
  SchemaData,
} from '@/utils/types'

export type {
  DiffEntry as FieldDiff,
  ListChanges,
  OrderedListChanges,
  RecordChanges,
} from '@/utils/jsonDiff'
export { diffSortedLists } from '@/utils/jsonDiff'

export type PresetStatus = 'added' | 'removed' | 'modified' | 'unchanged'

export type ModifiedPreset = {
  current: DenormalizedPreset
  release: DenormalizedPreset
  diffs: DiffEntry[]
}

export type ComparisonResult = {
  statusById: Map<string, PresetStatus>
  added: DenormalizedPreset[]
  removed: DenormalizedPreset[]
  modified: ModifiedPreset[]
}

type Dimension =
  | { label: string; kind: 'scalar'; value: string }
  | { label: string; kind: 'unordered-list'; value: string[] }
  | { label: string; kind: 'ordered-list'; value: string[] }
  | { label: string; kind: 'record'; value: Record<string, string> }

/** Fallback comparable dimensions from denormalized presets (no raw schema available). */
function dimensions(p: DenormalizedPreset): Dimension[] {
  return [
    { label: 'Name', kind: 'scalar', value: p.name },
    {
      label: 'Tags',
      kind: 'record',
      value: p.tags ?? {},
    },
    { label: 'Geometry', kind: 'ordered-list', value: [...p.geometry] },
    { label: 'Fields', kind: 'ordered-list', value: [...p.fields] },
    { label: 'More fields', kind: 'ordered-list', value: [...p.moreFields] },
    { label: 'Terms', kind: 'unordered-list', value: [...p.terms] },
    { label: 'Aliases', kind: 'unordered-list', value: [...p.aliases] },
    { label: 'Icon', kind: 'scalar', value: p.icon ?? '' },
    {
      label: 'Categories',
      kind: 'unordered-list',
      value: [...p.categoryIds].sort((a, b) => a.localeCompare(b)),
    },
  ]
}

function diffDimension(before: Dimension, after: Dimension): DiffEntry | null {
  if (before.kind === 'ordered-list' && after.kind === 'ordered-list') {
    return diffOrderedListDimension(before.label, before.value, after.value)
  }
  if (before.kind === 'unordered-list' && after.kind === 'unordered-list') {
    return diffUnorderedListDimension(before.label, before.value, after.value)
  }
  if (before.kind === 'record' && after.kind === 'record') {
    return diffRecordDimension(before.label, before.value, after.value)
  }
  if (before.kind === 'scalar' && after.kind === 'scalar' && before.value !== after.value) {
    return diffScalars(before.label, before.value, after.value)
  }
  return null
}

/** Field-level diff between baseline and current preset (denormalized fallback). */
export function diffPreset(release: DenormalizedPreset, current: DenormalizedPreset): DiffEntry[] {
  const a = dimensions(release)
  const b = dimensions(current)
  const diffs: DiffEntry[] = []
  for (let i = 0; i < a.length; i++) {
    const diff = diffDimension(a[i], b[i])
    if (diff) diffs.push(diff)
  }
  return diffs
}

function categoryIdsForPreset(presetId: string, categories: RawCategories): string[] {
  return Object.entries(categories)
    .filter(([, category]) => category.members?.includes(presetId))
    .map(([id]) => id)
    .sort((a, b) => a.localeCompare(b))
}

function diffPresetTranslation(
  presetId: string,
  baseline: RawTranslations,
  current: RawTranslations,
): DiffEntry[] {
  const b = baseline.en?.presets?.presets?.[presetId]
  const c = current.en?.presets?.presets?.[presetId]
  const diffs: DiffEntry[] = []

  const scalar = (label: string, before: unknown, after: unknown) => {
    const d = diffScalars(label, before, after)
    if (d) diffs.push(d)
  }

  scalar('Name', b?.name, c?.name)

  const terms = diffUnorderedListDimension(
    'Terms',
    normalizeStringList(b?.terms),
    normalizeStringList(c?.terms),
  )
  if (terms) diffs.push(terms)

  const aliases = diffUnorderedListDimension(
    'Aliases',
    normalizeStringList(b?.aliases),
    normalizeStringList(c?.aliases),
  )
  if (aliases) diffs.push(aliases)

  return diffs
}

function diffRawPreset(
  presetId: string,
  baseline: RawPreset,
  current: RawPreset,
  baselineTranslations: RawTranslations,
  currentTranslations: RawTranslations,
  baselineCategories: RawCategories,
  currentCategories: RawCategories,
): DiffEntry[] {
  const diffs: DiffEntry[] = []
  const scalar = (label: string, b: unknown, a: unknown) => {
    const d = diffScalars(label, b, a)
    if (d) diffs.push(d)
  }

  scalar('Icon', baseline.icon, current.icon)
  scalar('Image URL', baseline.imageURL, current.imageURL)
  scalar('Match score', baseline.matchScore, current.matchScore)
  scalar('Searchable', baseline.searchable, current.searchable)
  scalar('Suggestion', baseline.suggestion, current.suggestion)

  const tags = diffRecordDimension('Tags', baseline.tags ?? {}, current.tags ?? {})
  if (tags) diffs.push(tags)

  const addTags = diffRecordDimension('Add tags', baseline.addTags ?? {}, current.addTags ?? {})
  if (addTags) diffs.push(addTags)

  const removeTags = diffRecordDimension(
    'Remove tags',
    baseline.removeTags ?? {},
    current.removeTags ?? {},
  )
  if (removeTags) diffs.push(removeTags)

  const fields = diffOrderedListDimension('Fields', baseline.fields ?? [], current.fields ?? [])
  if (fields) diffs.push(fields)

  const moreFields = diffOrderedListDimension(
    'More fields',
    baseline.moreFields ?? [],
    current.moreFields ?? [],
  )
  if (moreFields) diffs.push(moreFields)

  const geometry = diffOrderedListDimension(
    'Geometry',
    baseline.geometry ?? [],
    current.geometry ?? [],
  )
  if (geometry) diffs.push(geometry)

  const baselineCategoryIds = categoryIdsForPreset(presetId, baselineCategories)
  const currentCategoryIds = categoryIdsForPreset(presetId, currentCategories)
  const categories = diffUnorderedListDimension(
    'Categories',
    baselineCategoryIds,
    currentCategoryIds,
  )
  if (categories) diffs.push(categories)

  diffs.push(...diffPresetTranslation(presetId, baselineTranslations, currentTranslations))

  return diffs
}

export function diffRawPresetById(
  presetId: string,
  baseline: SchemaData,
  current: SchemaData,
): DiffEntry[] {
  const basePreset = baseline.rawPresets[presetId]
  const currPreset = current.rawPresets[presetId]
  if (!basePreset || !currPreset) return []
  return diffRawPreset(
    presetId,
    basePreset,
    currPreset,
    baseline.translations,
    current.translations,
    baseline.categories,
    current.categories,
  )
}

export function diffPresetWithSchema(
  presetId: string,
  baseline: SchemaData,
  current: SchemaData,
): DiffEntry[] {
  return diffRawPresetById(presetId, baseline, current)
}

/** Compare preset datasets keyed by id. Prefer schema-aware diffs when both sides are loaded. */
export function comparePresets(
  release: DenormalizedPreset[],
  current: DenormalizedPreset[],
  options?: { baseline?: SchemaData; current?: SchemaData },
): ComparisonResult {
  const releaseById = new Map(release.map((p) => [p.id, p]))
  const currentById = new Map(current.map((p) => [p.id, p]))
  const useSchema = Boolean(options?.baseline && options?.current)

  const statusById = new Map<string, PresetStatus>()
  const added: DenormalizedPreset[] = []
  const removed: DenormalizedPreset[] = []
  const modified: ModifiedPreset[] = []

  for (const p of current) {
    const r = releaseById.get(p.id)
    if (!r) {
      statusById.set(p.id, 'added')
      added.push(p)
      continue
    }
    const diffs = useSchema
      ? diffPresetWithSchema(p.id, options!.baseline!, options!.current!)
      : diffPreset(r, p)
    if (diffs.length > 0) {
      statusById.set(p.id, 'modified')
      modified.push({ current: p, release: r, diffs })
    } else {
      statusById.set(p.id, 'unchanged')
    }
  }
  for (const r of release) {
    if (!currentById.has(r.id)) {
      statusById.set(r.id, 'removed')
      removed.push(r)
    }
  }

  const byName = (a: DenormalizedPreset, b: DenormalizedPreset) => a.name.localeCompare(b.name)
  added.sort(byName)
  removed.sort(byName)
  modified.sort((a, b) => byName(a.current, b.current))

  return { statusById, added, removed, modified }
}

/**
 * Heuristic for PR previews built from a branch behind current main: many presets
 * appear "removed" because unreleased moved on, not because the PR deleted them.
 */
export function isLikelyStaleBranchComparison(result: ComparisonResult): boolean {
  const intentional = result.added.length + result.modified.length
  const removed = result.removed.length
  if (removed < 10 || intentional === 0) return false
  return removed > intentional * 3
}

/** Format denormalized terms/aliases for tests and exports. */
export function formatPresetTermsAliases(preset: DenormalizedPreset): {
  terms: string[]
  aliases: string[]
} {
  return {
    terms: normalizeStringList(preset.terms),
    aliases: normalizeStringList(preset.aliases),
  }
}

/** @deprecated use sortedJoin from jsonDiff */
export function legacySortedJoin(arr: string[]): string {
  return sortedJoin(arr)
}
