import { fieldOptionDescription, fieldOptionTitle } from '@/utils/fieldOptionTranslation'
import {
  type DiffEntry,
  diffOrderedListDimension,
  diffRecordDimension,
  diffScalars,
  diffUnorderedListDimension,
  normalizeStringList,
} from '@/utils/jsonDiff'
import type { ComparisonResult } from '@/utils/presetDiff'
import type {
  FieldTranslations,
  RawCategories,
  RawField,
  RawFieldTranslation,
  RawFields,
  RawTranslations,
  SchemaData,
} from '@/utils/types'

export type EntityStatus = 'added' | 'removed' | 'modified' | 'unchanged'

export type ModifiedEntity<T> = {
  current: T
  baseline: T
  diffs: DiffEntry[]
}

export type EntityComparisonResult<T> = {
  statusById: Map<string, EntityStatus>
  added: T[]
  removed: T[]
  modified: ModifiedEntity<T>[]
}

export type FieldComparisonEntity = {
  id: string
  label: string
  key: string
  type: string
}

export type CategoryComparisonEntity = {
  id: string
  name: string
}

export type SchemaComparisonResult = {
  presets: ComparisonResult
  fields: EntityComparisonResult<FieldComparisonEntity>
  categories: EntityComparisonResult<CategoryComparisonEntity>
}

function compareEntityMaps<T extends { id: string }>(
  baseline: Map<string, T>,
  current: Map<string, T>,
  diffFn: (baseline: T, current: T) => DiffEntry[],
): EntityComparisonResult<T> {
  const statusById = new Map<string, EntityStatus>()
  const added: T[] = []
  const removed: T[] = []
  const modified: ModifiedEntity<T>[] = []

  for (const entity of current.values()) {
    const base = baseline.get(entity.id)
    if (!base) {
      statusById.set(entity.id, 'added')
      added.push(entity)
      continue
    }
    const diffs = diffFn(base, entity)
    if (diffs.length > 0) {
      statusById.set(entity.id, 'modified')
      modified.push({ current: entity, baseline: base, diffs })
    } else {
      statusById.set(entity.id, 'unchanged')
    }
  }

  for (const entity of baseline.values()) {
    if (!current.has(entity.id)) {
      statusById.set(entity.id, 'removed')
      removed.push(entity)
    }
  }

  const byLabel = (a: T, b: T) => {
    const aName = 'label' in a && typeof a.label === 'string' ? a.label : a.id
    const bName = 'label' in b && typeof b.label === 'string' ? b.label : b.id
    return aName.localeCompare(bName)
  }
  added.sort(byLabel)
  removed.sort(byLabel)
  modified.sort((a, b) => byLabel(a.current, b.current))

  return { statusById, added, removed, modified }
}

function fieldLabel(
  fieldId: string,
  field: RawField,
  translations: RawFieldTranslation | undefined,
): string {
  return translations?.label ?? field.label ?? fieldId
}

function diffFieldTranslations(
  baseline: RawFieldTranslation | undefined,
  current: RawFieldTranslation | undefined,
): DiffEntry[] {
  const diffs: DiffEntry[] = []
  const scalar = (label: string, b: unknown, a: unknown) => {
    const d = diffScalars(label, b, a)
    if (d) diffs.push(d)
  }

  scalar('Label', baseline?.label, current?.label)
  scalar('Placeholder', baseline?.placeholder, current?.placeholder)

  const terms = diffUnorderedListDimension(
    'Terms',
    normalizeStringList(baseline?.terms),
    normalizeStringList(current?.terms),
  )
  if (terms) diffs.push(terms)

  const baseOptions = baseline?.options ?? {}
  const currOptions = current?.options ?? {}
  const optionKeys = new Set([...Object.keys(baseOptions), ...Object.keys(currOptions)])
  for (const key of [...optionKeys].sort((a, b) => a.localeCompare(b))) {
    const b = baseOptions[key]
    const a = currOptions[key]
    if (!b && a) {
      diffs.push({
        label: `Option “${key}”`,
        kind: 'scalar',
        before: '',
        after: fieldOptionTitle(a) ?? key,
      })
    } else if (b && !a) {
      diffs.push({
        label: `Option “${key}”`,
        kind: 'scalar',
        before: fieldOptionTitle(b) ?? key,
        after: '',
      })
    } else if (b && a) {
      const title = diffScalars(`Option “${key}” title`, fieldOptionTitle(b), fieldOptionTitle(a))
      if (title) diffs.push(title)
      const desc = diffScalars(
        `Option “${key}” description`,
        fieldOptionDescription(b),
        fieldOptionDescription(a),
      )
      if (desc) diffs.push(desc)
    }
  }

  return diffs
}

function diffFieldDefinition(
  baseline: RawField,
  current: RawField,
  baselineTranslations: RawFieldTranslation | undefined,
  currentTranslations: RawFieldTranslation | undefined,
): DiffEntry[] {
  const diffs: DiffEntry[] = []
  const scalar = (label: string, b: unknown, a: unknown) => {
    const d = diffScalars(label, b, a)
    if (d) diffs.push(d)
  }

  scalar('Type', baseline.type, current.type)
  scalar('Key', baseline.key ?? baseline.keys?.join(', '), current.key ?? current.keys?.join(', '))

  const keys = diffUnorderedListDimension('Keys', baseline.keys ?? [], current.keys ?? [])
  if (keys) diffs.push(keys)

  const geometry = diffOrderedListDimension(
    'Geometry',
    baseline.geometry ?? [],
    current.geometry ?? [],
  )
  if (geometry) diffs.push(geometry)

  scalar('Universal', baseline.universal, current.universal)

  const options = diffOrderedListDimension('Options', baseline.options ?? [], current.options ?? [])
  if (options) diffs.push(options)

  const icons = diffRecordDimension('Icons', baseline.icons ?? {}, current.icons ?? {})
  if (icons) diffs.push(icons)

  const prerequisiteBefore = baseline.prerequisiteTag
    ? `${baseline.prerequisiteTag.key}=${baseline.prerequisiteTag.value}`
    : ''
  const prerequisiteAfter = current.prerequisiteTag
    ? `${current.prerequisiteTag.key}=${current.prerequisiteTag.value}`
    : ''
  const prerequisite = diffScalars('Prerequisite tag', prerequisiteBefore, prerequisiteAfter)
  if (prerequisite) diffs.push(prerequisite)

  const fieldTerms = diffUnorderedListDimension(
    'Field terms',
    baseline.terms ?? [],
    current.terms ?? [],
  )
  if (fieldTerms) diffs.push(fieldTerms)

  scalar('Label (source)', baseline.label, current.label)
  scalar('Placeholder (source)', baseline.placeholder, current.placeholder)

  diffs.push(...diffFieldTranslations(baselineTranslations, currentTranslations))

  return diffs
}

function diffCategory(
  categoryId: string,
  baseline: { icon?: string; members?: string[] },
  current: { icon?: string; members?: string[] },
  baselineTranslations: RawTranslations,
  currentTranslations: RawTranslations,
): DiffEntry[] {
  const diffs: DiffEntry[] = []
  const icon = diffScalars('Icon', baseline.icon, current.icon)
  if (icon) diffs.push(icon)

  const members = diffOrderedListDimension('Members', baseline.members ?? [], current.members ?? [])
  if (members) diffs.push(members)

  const baseName = baselineTranslations.en?.presets?.categories?.[categoryId]?.name
  const currName = currentTranslations.en?.presets?.categories?.[categoryId]?.name
  const name = diffScalars('Name', baseName, currName)
  if (name) diffs.push(name)

  return diffs
}

function buildFieldEntities(
  fields: RawFields,
  fieldTranslations: FieldTranslations,
): Map<string, FieldComparisonEntity> {
  const map = new Map<string, FieldComparisonEntity>()
  for (const [id, field] of Object.entries(fields)) {
    map.set(id, {
      id,
      label: fieldLabel(id, field, fieldTranslations[id]),
      key: field.key ?? field.keys?.[0] ?? id,
      type: field.type ?? 'unknown',
    })
  }
  return map
}

function buildCategoryEntities(
  categories: RawCategories,
  categoryNames: Record<string, string>,
): Map<string, CategoryComparisonEntity> {
  const map = new Map<string, CategoryComparisonEntity>()
  for (const id of Object.keys(categories)) {
    map.set(id, { id, name: categoryNames[id] ?? id })
  }
  return map
}

export function compareFields(
  baseline: SchemaData,
  current: SchemaData,
): EntityComparisonResult<FieldComparisonEntity> {
  const baselineEntities = buildFieldEntities(baseline.fields, baseline.fieldTranslations)
  const currentEntities = buildFieldEntities(current.fields, current.fieldTranslations)

  return compareEntityMaps(baselineEntities, currentEntities, (base, curr) =>
    diffFieldDefinition(
      baseline.fields[base.id] ?? {},
      current.fields[curr.id] ?? {},
      baseline.fieldTranslations[base.id],
      current.fieldTranslations[curr.id],
    ),
  )
}

export function compareCategories(
  baseline: SchemaData,
  current: SchemaData,
): EntityComparisonResult<CategoryComparisonEntity> {
  const baselineEntities = buildCategoryEntities(baseline.categories, baseline.categoryNames)
  const currentEntities = buildCategoryEntities(current.categories, current.categoryNames)

  return compareEntityMaps(baselineEntities, currentEntities, (base, curr) =>
    diffCategory(
      curr.id,
      baseline.categories[base.id] ?? {},
      current.categories[curr.id] ?? {},
      baseline.translations,
      current.translations,
    ),
  )
}

/** Full schema comparison: presets (denormalized view) + raw field + category diffs. */
export function compareSchemas(
  baseline: SchemaData,
  current: SchemaData,
  presetComparison: ComparisonResult,
): SchemaComparisonResult {
  return {
    presets: presetComparison,
    fields: compareFields(baseline, current),
    categories: compareCategories(baseline, current),
  }
}

export function entityChangeCount<T>(result: EntityComparisonResult<T>): number {
  return result.added.length + result.removed.length + result.modified.length
}

export function schemaChangeCount(result: SchemaComparisonResult): number {
  return (
    result.presets.added.length +
    result.presets.removed.length +
    result.presets.modified.length +
    entityChangeCount(result.fields) +
    entityChangeCount(result.categories)
  )
}

/** Summarize option-only field changes for quick scanning. */
export function summarizeFieldDiff(diffs: DiffEntry[]): string {
  const options = diffs.find((d) => d.label === 'Options')
  if (!options?.orderedListChanges) return ''
  const { added, removed, moved } = options.orderedListChanges
  const parts: string[] = []
  if (added.length) parts.push(`+${added.join(', ')}`)
  if (removed.length) parts.push(`−${removed.join(', ')}`)
  if (moved.length) {
    parts.push(moved.map((m) => `${m.item} #${m.fromIndex + 1}→#${m.toIndex + 1}`).join(', '))
  }
  return parts.join(' · ')
}

export function formatDiffValue(entry: DiffEntry): { before: string; after: string } {
  if (entry.kind === 'scalar') {
    return { before: entry.before ?? '', after: entry.after ?? '' }
  }
  return { before: entry.before ?? '', after: entry.after ?? '' }
}
