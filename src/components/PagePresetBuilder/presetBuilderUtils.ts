import {
  parseStringList,
  parseTagObject,
  stringifyStringList,
  stringifyTagObject,
} from '@/components/PagePresetBuilder/presetBuilderUrlCodec'
import { sortObjectEntries } from '@/components/PagePresets/presetKeyOrder'
import { schemaRepoPath } from '@/utils/githubFileUrl'
import type { RawPreset } from '@/utils/types'

export { parseStringList, parseTagObject, stringifyStringList, stringifyTagObject }

export const GEOMETRY_OPTIONS = ['point', 'vertex', 'line', 'area', 'relation'] as const

export type PresetBuilderTranslations = {
  name: string
  terms: string[]
  aliases: string[]
}

export type PresetBuilderState = {
  name: string
  icon: string
  searchable: boolean
  tags: Record<string, string>
  geometry: string[]
  fields: string[]
  moreFields: string[]
  terms: string[]
  aliases: string[]
  addTags: Record<string, string>
  removeTags: Record<string, string>
  matchScore: string
  referenceKey: string
  referenceValue: string
  locationSetInclude: string[]
  locationSetExclude: string[]
  locationSetCrossReference: string
  relation: string
  relationCrossReference: string
  advancedOpen: boolean
}

export const PRESET_BUILDER_DEFAULTS: PresetBuilderState = {
  name: '',
  icon: '',
  searchable: true,
  tags: {},
  geometry: [],
  fields: [],
  moreFields: [],
  terms: [],
  aliases: [],
  addTags: {},
  removeTags: {},
  matchScore: '',
  referenceKey: '',
  referenceValue: '',
  locationSetInclude: [],
  locationSetExclude: [],
  locationSetCrossReference: '',
  relation: '',
  relationCrossReference: '',
  advancedOpen: false,
}

/** Derive preset id from tags using id-tagging-schema path conventions. */
export function presetIdFromTags(tags: Record<string, string>): string | null {
  const entries = Object.entries(tags)
    .map(([key, value]) => [key.trim(), value.trim()] as const)
    .filter(([key, value]) => key && value)

  if (entries.length === 0) return null

  const primaryCandidates = entries.filter(([key]) => !key.includes(':'))
  const [primaryKey, primaryValue] =
    primaryCandidates.sort(([a], [b]) => a.localeCompare(b))[0] ??
    entries.sort(([a], [b]) => a.localeCompare(b))[0]

  const segments = [primaryKey, primaryValue]
  const secondary = entries
    .filter(([key]) => key !== primaryKey)
    .sort(([a], [b]) => a.localeCompare(b))

  for (const [, value] of secondary) {
    segments.push(value)
  }

  return segments.join('/')
}

export function presetRepoPath(presetId: string, searchable: boolean): string {
  return schemaRepoPath('preset', presetId, { searchable })
}

export function buildRawPreset(state: PresetBuilderState): RawPreset {
  const preset: RawPreset = {}

  if (state.name.trim()) {
    preset.name = state.name.trim()
  }

  if (state.icon.trim()) {
    preset.icon = state.icon.trim()
  }

  const tagEntries = Object.entries(state.tags).filter(([, value]) => value.trim())
  if (tagEntries.length > 0) {
    preset.tags = Object.fromEntries(tagEntries)
  }

  if (state.geometry.length > 0) {
    preset.geometry = [...state.geometry]
  }

  if (state.fields.length > 0) {
    preset.fields = [...state.fields]
  }

  if (state.moreFields.length > 0) {
    preset.moreFields = [...state.moreFields]
  }

  if (!state.searchable) {
    preset.searchable = false
  }

  const addTagEntries = Object.entries(state.addTags).filter(([, value]) => value.trim())
  if (addTagEntries.length > 0) {
    preset.addTags = Object.fromEntries(addTagEntries)
  }

  const removeTagEntries = Object.entries(state.removeTags).filter(([, value]) => value.trim())
  if (removeTagEntries.length > 0) {
    preset.removeTags = Object.fromEntries(removeTagEntries)
  }

  const matchScore = Number.parseFloat(state.matchScore)
  if (state.matchScore.trim() && !Number.isNaN(matchScore)) {
    preset.matchScore = matchScore
  }

  if (state.referenceKey.trim() && state.referenceValue.trim()) {
    preset.reference = { key: state.referenceKey.trim(), value: state.referenceValue.trim() }
  }

  if (state.locationSetInclude.length > 0 || state.locationSetExclude.length > 0) {
    preset.locationSet = {
      ...(state.locationSetInclude.length > 0 ? { include: [...state.locationSetInclude] } : {}),
      ...(state.locationSetExclude.length > 0 ? { exclude: [...state.locationSetExclude] } : {}),
    }
  }

  if (state.locationSetCrossReference.trim()) {
    preset.locationSetCrossReference = state.locationSetCrossReference.trim()
  }

  if (state.relation.trim()) {
    preset.relation = state.relation.trim()
  }

  if (state.relationCrossReference.trim()) {
    preset.relationCrossReference = state.relationCrossReference.trim()
  }

  return preset
}

export function formatPresetJson(preset: RawPreset): string {
  const sorted = sortObjectEntries(Object.entries(preset), { sortMode: 'preset' })
  const ordered = Object.fromEntries(sorted)
  return `${JSON.stringify(ordered, null, 2)}\n`
}

export function buildTranslationSnippet(
  presetId: string,
  translations: PresetBuilderTranslations,
): string {
  const lines: string[] = []
  const enBlock: Record<string, unknown> = {}

  if (translations.name.trim()) {
    enBlock.name = translations.name.trim()
  }
  if (translations.terms.length > 0) {
    enBlock.terms = translations.terms.join(', ')
  }
  if (translations.aliases.length > 0) {
    enBlock.aliases = translations.aliases.join('\n')
  }

  if (Object.keys(enBlock).length === 0) {
    return ''
  }

  lines.push('// data/dist/translations/en.min.json — presets.presets section')
  lines.push(JSON.stringify({ [presetId]: enBlock }, null, 2))
  return `${lines.join('\n')}\n`
}

export function isPresetRef(value: string): boolean {
  return /^\{[^}]+\}$/.test(value.trim())
}

export function builderStatesEqual(a: PresetBuilderState, b: PresetBuilderState): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
