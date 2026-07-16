/** Semantic JSON diff primitives — order-aware where it matters, multiset where it does not. */

export type ListChanges = {
  removed: string[]
  added: string[]
  unchangedCount: number
}

export type OrderedListChanges = {
  removed: string[]
  added: string[]
  moved: Array<{ item: string; fromIndex: number; toIndex: number }>
  unchangedCount: number
}

export type RecordChanges = {
  removed: string[]
  added: string[]
  modified: Array<{ key: string; before: string; after: string }>
}

export type DiffEntry = {
  label: string
  kind: 'scalar' | 'unordered-list' | 'ordered-list' | 'record'
  before?: string
  after?: string
  listChanges?: ListChanges
  orderedListChanges?: OrderedListChanges
  recordChanges?: RecordChanges
}

export function formatScalar(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

export function normalizeStringList(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? [...value] : [value]
}

function countItems(items: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1)
  }
  return counts
}

/** Multiset diff — order does not matter (terms, aliases, geometry when treated as a set). */
export function diffSortedLists(before: string[], after: string[]): ListChanges | null {
  const beforeCounts = countItems(before)
  const afterCounts = countItems(after)
  const keys = new Set([...beforeCounts.keys(), ...afterCounts.keys()])

  const removed: string[] = []
  const added: string[] = []
  let unchangedCount = 0

  for (const key of [...keys].sort((a, b) => a.localeCompare(b))) {
    const beforeCount = beforeCounts.get(key) ?? 0
    const afterCount = afterCounts.get(key) ?? 0
    const shared = Math.min(beforeCount, afterCount)
    unchangedCount += shared
    for (let i = 0; i < beforeCount - shared; i++) removed.push(key)
    for (let i = 0; i < afterCount - shared; i++) added.push(key)
  }

  if (removed.length === 0 && added.length === 0) return null
  return { removed, added, unchangedCount }
}

function pairIndicesByItem(
  before: string[],
  after: string[],
): Array<{ item: string; fromIndex: number; toIndex: number }> {
  const afterBuckets = new Map<string, number[]>()
  for (let i = 0; i < after.length; i++) {
    const item = after[i]!
    const bucket = afterBuckets.get(item) ?? []
    bucket.push(i)
    afterBuckets.set(item, bucket)
  }

  const pairs: Array<{ item: string; fromIndex: number; toIndex: number }> = []
  for (let fromIndex = 0; fromIndex < before.length; fromIndex++) {
    const item = before[fromIndex]!
    const bucket = afterBuckets.get(item)
    if (!bucket || bucket.length === 0) continue
    const toIndex = bucket.shift()!
    pairs.push({ item, fromIndex, toIndex })
  }
  return pairs
}

/**
 * Positional list diff — order matters (fields, moreFields, options, category members).
 * Detects insertions, removals, and pure reordering when the multiset is unchanged.
 */
export function diffOrderedLists(before: string[], after: string[]): OrderedListChanges | null {
  if (before.length === after.length && before.every((item, index) => item === after[index])) {
    return null
  }

  const multiset = diffSortedLists(before, after)
  const pairs = pairIndicesByItem(before, after)
  const hasMultisetChanges = Boolean(
    multiset && (multiset.removed.length > 0 || multiset.added.length > 0),
  )
  const moved = hasMultisetChanges
    ? []
    : pairs
        .filter((pair) => pair.fromIndex !== pair.toIndex)
        .sort((a, b) => a.fromIndex - b.fromIndex)

  if (!multiset && moved.length === 0) return null

  return {
    removed: multiset?.removed ?? [],
    added: multiset?.added ?? [],
    moved,
    unchangedCount: pairs.filter((pair) => pair.fromIndex === pair.toIndex).length,
  }
}

export function sortedJoin(arr: string[]): string {
  return [...arr].sort((a, b) => a.localeCompare(b)).join(', ')
}

export function joinList(arr: string[]): string {
  return arr.join(', ')
}

/** Record diff — key order does not matter (tags, icons maps). */
export function diffRecords(
  before: Record<string, string>,
  after: Record<string, string>,
): RecordChanges | null {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  const removed: string[] = []
  const added: string[] = []
  const modified: Array<{ key: string; before: string; after: string }> = []

  for (const key of [...keys].sort((a, b) => a.localeCompare(b))) {
    const b = before[key]
    const a = after[key]
    if (b === undefined && a !== undefined) {
      added.push(key)
    } else if (b !== undefined && a === undefined) {
      removed.push(key)
    } else if (b !== undefined && a !== undefined && b !== a) {
      modified.push({ key, before: b, after: a })
    }
  }

  if (removed.length === 0 && added.length === 0 && modified.length === 0) return null
  return { removed, added, modified }
}

export function diffScalars(label: string, before: unknown, after: unknown): DiffEntry | null {
  const b = formatScalar(before)
  const a = formatScalar(after)
  if (b === a) return null
  return { label, kind: 'scalar', before: b, after: a }
}

export function diffUnorderedListDimension(
  label: string,
  before: string[],
  after: string[],
): DiffEntry | null {
  const listChanges = diffSortedLists(before, after)
  if (!listChanges) return null
  return {
    label,
    kind: 'unordered-list',
    before: sortedJoin(before),
    after: sortedJoin(after),
    listChanges,
  }
}

export function diffOrderedListDimension(
  label: string,
  before: string[],
  after: string[],
): DiffEntry | null {
  const orderedListChanges = diffOrderedLists(before, after)
  if (!orderedListChanges) return null
  return {
    label,
    kind: 'ordered-list',
    before: joinList(before),
    after: joinList(after),
    orderedListChanges,
  }
}

export function diffRecordDimension(
  label: string,
  before: Record<string, string>,
  after: Record<string, string>,
): DiffEntry | null {
  const recordChanges = diffRecords(before, after)
  if (!recordChanges) return null
  const formatRecord = (record: Record<string, string>) =>
    Object.entries(record)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')
  return {
    label,
    kind: 'record',
    before: formatRecord(before),
    after: formatRecord(after),
    recordChanges,
  }
}
