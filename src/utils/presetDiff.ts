import type { DenormalizedPreset } from './types'

export type PresetStatus = 'added' | 'removed' | 'modified' | 'unchanged'

export type ListChanges = {
  removed: string[]
  added: string[]
  unchangedCount: number
}

/** A single changed dimension of a preset (e.g. its tags or fields). */
export type FieldDiff = {
  label: string
  before: string
  after: string
  /** Per-item additions/removals when this dimension is a sorted list. */
  listChanges?: ListChanges
}

export type ModifiedPreset = {
  current: DenormalizedPreset
  release: DenormalizedPreset
  diffs: FieldDiff[]
}

export type ComparisonResult = {
  statusById: Map<string, PresetStatus>
  added: DenormalizedPreset[]
  removed: DenormalizedPreset[]
  modified: ModifiedPreset[]
}

const sortedJoin = (arr: string[]) => [...arr].sort((a, b) => a.localeCompare(b)).join(', ')

type Dimension =
  | { label: string; kind: 'scalar'; value: string }
  | { label: string; kind: 'list'; value: string[] }

/** The comparable dimensions of a preset, each reduced to a stable string. */
function dimensions(p: DenormalizedPreset): Dimension[] {
  return [
    { label: 'Name', kind: 'scalar', value: p.name },
    {
      label: 'Tags',
      kind: 'list',
      value: Object.entries(p.tags ?? {})
        .map(([k, v]) => `${k}=${v}`)
        .sort((a, b) => a.localeCompare(b)),
    },
    { label: 'Geometry', kind: 'list', value: [...p.geometry].sort((a, b) => a.localeCompare(b)) },
    { label: 'Fields', kind: 'list', value: [...p.fields].sort((a, b) => a.localeCompare(b)) },
    {
      label: 'More fields',
      kind: 'list',
      value: [...p.moreFields].sort((a, b) => a.localeCompare(b)),
    },
    { label: 'Terms', kind: 'list', value: [...p.terms].sort((a, b) => a.localeCompare(b)) },
    { label: 'Aliases', kind: 'list', value: [...p.aliases].sort((a, b) => a.localeCompare(b)) },
    { label: 'Icon', kind: 'scalar', value: p.icon ?? '' },
  ]
}

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

function countItems(items: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1)
  }
  return counts
}

function diffDimension(before: Dimension, after: Dimension): FieldDiff | null {
  if (before.kind === 'list' && after.kind === 'list') {
    const listChanges = diffSortedLists(before.value, after.value)
    if (!listChanges) return null
    return {
      label: before.label,
      before: sortedJoin(before.value),
      after: sortedJoin(after.value),
      listChanges,
    }
  }

  if (before.kind === 'scalar' && after.kind === 'scalar' && before.value !== after.value) {
    return { label: before.label, before: before.value, after: after.value }
  }
  return null
}

/** Field-level diff between the release version and the current version of one preset. */
export function diffPreset(release: DenormalizedPreset, current: DenormalizedPreset): FieldDiff[] {
  const a = dimensions(release)
  const b = dimensions(current)
  const diffs: FieldDiff[] = []
  for (let i = 0; i < a.length; i++) {
    const diff = diffDimension(a[i], b[i])
    if (diff) diffs.push(diff)
  }
  return diffs
}

/** Compare the current dataset against the release, keyed by preset id. */
export function comparePresets(
  release: DenormalizedPreset[],
  current: DenormalizedPreset[],
): ComparisonResult {
  const releaseById = new Map(release.map((p) => [p.id, p]))
  const currentById = new Map(current.map((p) => [p.id, p]))

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
    const diffs = diffPreset(r, p)
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
