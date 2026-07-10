import {
  collectRegionsFromLocationSets,
  describeLocationSet,
  regionInLocationSet,
  type LocationSet,
} from '@/utils/locationSet'
import {
  describePrerequisiteTag,
  matchesPrerequisiteTag,
  type PrerequisiteTag,
} from '@/utils/prerequisiteTag'
import { resolvePresetFieldIds, fieldMatchesGeometry } from '@/utils/resolvePresetFieldIds'
import type { RawField, RawFields, RawPreset, RawPresets } from '@/utils/types'

export type OsmGeometry = 'point' | 'vertex' | 'line' | 'area' | 'relation'

export type PresetMatchCandidate = {
  presetId: string
  preset: RawPreset
  score: number
  tagCount: number
  wildcardCount: number
  locationSet?: LocationSet
  locationSummary: string
}

export type AddTagsGap = {
  key: string
  expected: string
  actual?: string
}

export type FieldVisibility = {
  fieldId: string
  fieldKey: string
  visible: boolean
  reason?: string
  prerequisite?: PrerequisiteTag
  locationSummary?: string
}

export type RegionWinner = {
  region: string
  presetId: string
  locationSummary: string
}

export type PresetModeMatchResult = {
  winner: PresetMatchCandidate | null
  matches: PresetMatchCandidate[]
  fallbackUsed: boolean
  addTagsGaps: AddTagsGap[]
  discardedTagKeys: string[]
  fieldVisibility: FieldVisibility[]
  regionWinners: RegionWinner[]
  geometry: OsmGeometry
}

type GeometryIndex = Record<OsmGeometry, Record<string, Record<string, string[]>>>

const FALLBACK_BY_GEOMETRY: Record<
  OsmGeometry,
  { tags: Record<string, string>; matchScore: number }
> = {
  point: { tags: {}, matchScore: 0.1 },
  vertex: { tags: {}, matchScore: 0.1 },
  line: { tags: {}, matchScore: 0.1 },
  area: { tags: { area: 'yes' }, matchScore: 0.1 },
  relation: { tags: {}, matchScore: 0.1 },
}

function effectiveAddTags(preset: RawPreset): Record<string, string> {
  return { ...(preset.addTags ?? preset.tags) }
}

function presetMatchScore(preset: RawPreset, entityTags: Record<string, string>): number {
  const presetTags = preset.tags ?? {}
  const originalScore = preset.matchScore ?? 1
  let score = 0
  const seen: Record<string, boolean> = {}

  for (const [key, value] of Object.entries(presetTags)) {
    seen[key] = true
    if (entityTags[key] === value) {
      score += originalScore
    } else if (value === '*' && key in entityTags) {
      score += originalScore / 2
    } else {
      return -1
    }
  }

  const addTags = effectiveAddTags(preset)
  for (const [key, value] of Object.entries(addTags)) {
    if (!seen[key] && entityTags[key] === value) {
      score += originalScore
    }
  }

  if (preset.searchable === false) {
    score *= 0.999
  }

  return score
}

function buildGeometryIndex(rawPresets: RawPresets): GeometryIndex {
  const index: GeometryIndex = {
    point: {},
    vertex: {},
    line: {},
    area: {},
    relation: {},
  }

  for (const [presetId, preset] of Object.entries(rawPresets)) {
    for (const geometry of preset.geometry ?? []) {
      const geom = geometry as OsmGeometry
      if (!index[geom]) continue
      for (const [key, value] of Object.entries(preset.tags ?? {})) {
        index[geom][key] ??= {}
        index[geom][key][value] ??= []
        index[geom][key][value].push(presetId)
      }
    }
  }

  return index
}

function compareCandidates(a: PresetMatchCandidate, b: PresetMatchCandidate): number {
  if (b.score !== a.score) return b.score - a.score
  if (b.tagCount !== a.tagCount) return b.tagCount - a.tagCount
  if (b.wildcardCount !== a.wildcardCount) return a.wildcardCount - b.wildcardCount
  return a.presetId.localeCompare(b.presetId)
}

function toCandidate(presetId: string, preset: RawPreset, score: number): PresetMatchCandidate {
  const presetTags = preset.tags ?? {}
  const tagCount = Object.keys(presetTags).length
  const wildcardCount = Object.values(presetTags).filter((v) => v === '*').length
  const locationSet = preset.locationSet

  return {
    presetId,
    preset,
    score,
    tagCount,
    wildcardCount,
    locationSet,
    locationSummary: describeLocationSet(locationSet),
  }
}

function findMatchCandidates(
  tags: Record<string, string>,
  geometry: OsmGeometry,
  rawPresets: RawPresets,
  geometryIndex: GeometryIndex,
): PresetMatchCandidate[] {
  const keyIndex = geometryIndex[geometry]
  const byId = new Map<string, PresetMatchCandidate>()

  for (const key of Object.keys(tags)) {
    const valueIndex = keyIndex[key]
    if (!valueIndex) continue

    const indexMatches: string[] = []
    const valueMatches = valueIndex[tags[key]]
    if (valueMatches) indexMatches.push(...valueMatches)
    const starMatches = valueIndex['*']
    if (starMatches) indexMatches.push(...starMatches)

    for (const presetId of indexMatches) {
      const preset = rawPresets[presetId]
      if (!preset) continue
      const score = presetMatchScore(preset, tags)
      if (score < 0) continue

      const existing = byId.get(presetId)
      if (!existing || score > existing.score) {
        byId.set(presetId, toCandidate(presetId, preset, score))
      }
    }
  }

  return [...byId.values()].sort(compareCandidates)
}

function isFallbackPreset(candidate: PresetMatchCandidate): boolean {
  const tagCount = Object.keys(candidate.preset.tags ?? {}).length
  return tagCount === 0 || (tagCount === 1 && Object.hasOwn(candidate.preset.tags ?? {}, 'area'))
}

function pickWinner(
  candidates: PresetMatchCandidate[],
  region: string | undefined,
  tags: Record<string, string>,
  geometry: OsmGeometry,
  rawPresets: RawPresets,
  geometryIndex: GeometryIndex,
): { winner: PresetMatchCandidate | null; fallbackUsed: boolean } {
  let pool = region
    ? candidates.filter((c) => regionInLocationSet(region, c.locationSet))
    : [...candidates]

  if (pool.length > 0) {
    return { winner: pool[0], fallbackUsed: isFallbackPreset(pool[0]) }
  }

  // addr:* fallback — mirrors iD #4353
  const hasAddr = Object.keys(tags).some((k) => k.startsWith('addr:'))
  if (hasAddr) {
    const addrMatches = geometryIndex[geometry]['addr:*']?.['*'] ?? []
    const addrPresetId = addrMatches[0]
    if (addrPresetId && rawPresets[addrPresetId]) {
      const preset = rawPresets[addrPresetId]
      return {
        winner: toCandidate(addrPresetId, preset, presetMatchScore(preset, tags)),
        fallbackUsed: true,
      }
    }
  }

  const fallback = FALLBACK_BY_GEOMETRY[geometry]
  return {
    winner: toCandidate(
      `fallback/${geometry}`,
      { ...fallback, geometry: [geometry] },
      fallback.matchScore,
    ),
    fallbackUsed: true,
  }
}

function computeAddTagsGaps(preset: RawPreset, tags: Record<string, string>): AddTagsGap[] {
  const gaps: AddTagsGap[] = []
  const addTags = effectiveAddTags(preset)

  for (const [key, expected] of Object.entries(addTags)) {
    if (expected === '*') {
      if (!(key in tags)) {
        gaps.push({ key, expected: 'yes (wildcard)' })
      }
      continue
    }
    if (tags[key] !== expected) {
      gaps.push({ key, expected, actual: tags[key] })
    }
  }

  return gaps
}

function fieldKey(field: RawField | undefined, fieldId: string): string {
  return field?.key ?? fieldId
}

function analyzeFieldVisibility(
  presetId: string,
  preset: RawPreset,
  tags: Record<string, string>,
  geometry: OsmGeometry,
  region: string | undefined,
  rawPresets: RawPresets,
  fields: RawFields,
): FieldVisibility[] {
  const result: FieldVisibility[] = []

  for (const fieldId of resolvePresetFieldIds(presetId, preset, rawPresets, fields)) {
    const field = fields[fieldId] as
      | (RawField & { prerequisiteTag?: PrerequisiteTag; locationSet?: LocationSet })
      | undefined
    if (!field) continue
    if (!fieldMatchesGeometry(field, geometry)) continue

    const fk = fieldKey(field, fieldId)
    const prereq = field.prerequisiteTag
    const prereqOk = matchesPrerequisiteTag(prereq, tags, fk)
    const locOk = !region || regionInLocationSet(region, field.locationSet)

    let visible = prereqOk && locOk
    let reason: string | undefined

    if (!prereqOk && prereq) {
      reason = `Needs ${describePrerequisiteTag(prereq)}`
      visible = false
    } else if (!locOk && field.locationSet) {
      reason = `Only in ${describeLocationSet(field.locationSet)}`
      visible = false
    } else if (!prereqOk) {
      visible = true
    }

    result.push({
      fieldId,
      fieldKey: fk,
      visible,
      reason,
      prerequisite: prereq,
      locationSummary: field.locationSet ? describeLocationSet(field.locationSet) : undefined,
    })
  }

  return result
}

function computeRegionWinners(
  candidates: PresetMatchCandidate[],
  region: string | undefined,
): RegionWinner[] {
  const regions = new Set<string>()
  if (region) regions.add(region.toLowerCase())
  for (const r of collectRegionsFromLocationSets(candidates.map((c) => c.locationSet))) {
    regions.add(r)
  }

  const winners: RegionWinner[] = []
  for (const r of [...regions].sort((a, b) => a.localeCompare(b))) {
    const pool = candidates.filter((c) => regionInLocationSet(r, c.locationSet))
    if (pool.length === 0) continue
    const top = pool[0]
    winners.push({
      region: r.toUpperCase(),
      presetId: top.presetId,
      locationSummary: top.locationSummary,
    })
  }

  return winners
}

export type MatchPresetModeInput = {
  tags: Record<string, string>
  geometry: OsmGeometry
  region?: string
  rawPresets: RawPresets
  fields: RawFields
  discarded?: Record<string, boolean>
}

export function matchPresetMode(input: MatchPresetModeInput): PresetModeMatchResult {
  const { tags, geometry, region, rawPresets, fields, discarded } = input
  const geometryIndex = buildGeometryIndex(rawPresets)
  const matches = findMatchCandidates(tags, geometry, rawPresets, geometryIndex)
  const { winner, fallbackUsed } = pickWinner(
    matches,
    region,
    tags,
    geometry,
    rawPresets,
    geometryIndex,
  )

  const addTagsGaps = winner ? computeAddTagsGaps(winner.preset, tags) : []
  const discardedTagKeys = Object.keys(tags).filter((key) => discarded?.[key])

  const fieldVisibility =
    winner && !winner.presetId.startsWith('fallback/')
      ? analyzeFieldVisibility(
          winner.presetId,
          winner.preset,
          tags,
          geometry,
          region,
          rawPresets,
          fields,
        )
      : []

  const regionWinners = computeRegionWinners(matches, region)

  return {
    winner,
    matches,
    fallbackUsed,
    addTagsGaps,
    discardedTagKeys,
    fieldVisibility,
    regionWinners,
    geometry,
  }
}
