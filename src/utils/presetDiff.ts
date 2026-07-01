import type { DenormalizedPreset } from './types'

export type PresetStatus = 'added' | 'removed' | 'modified' | 'unchanged'

/** A single changed dimension of a preset (e.g. its tags or fields). */
export type FieldDiff = { label: string; before: string; after: string }

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

/** The comparable dimensions of a preset, each reduced to a stable string. */
function dimensions(p: DenormalizedPreset): { label: string; value: string }[] {
  return [
    { label: 'Name', value: p.name },
    {
      label: 'Tags',
      value: Object.entries(p.tags ?? {})
        .map(([k, v]) => `${k}=${v}`)
        .sort((a, b) => a.localeCompare(b))
        .join(', '),
    },
    { label: 'Geometry', value: sortedJoin(p.geometry) },
    { label: 'Fields', value: sortedJoin(p.fields) },
    { label: 'More fields', value: sortedJoin(p.moreFields) },
    { label: 'Terms', value: sortedJoin(p.terms) },
    { label: 'Aliases', value: sortedJoin(p.aliases) },
    { label: 'Icon', value: p.icon ?? '' },
  ]
}

/** Field-level diff between the release version and the current version of one preset. */
export function diffPreset(release: DenormalizedPreset, current: DenormalizedPreset): FieldDiff[] {
  const a = dimensions(release)
  const b = dimensions(current)
  const diffs: FieldDiff[] = []
  for (let i = 0; i < a.length; i++) {
    if (a[i].value !== b[i].value) {
      diffs.push({ label: a[i].label, before: a[i].value, after: b[i].value })
    }
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
