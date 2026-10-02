import { z } from 'zod'
import type { PresetBuilderState } from '@/components/PagePresetBuilder/presetBuilderTypes'
import {
  parseDraftFields,
  parseStringList,
  parseTagObject,
  stringifyDraftFields,
  stringifyStringList,
  stringifyTagObject,
} from '@/components/PagePresetBuilder/presetBuilderUrlCodec'

/** TanStack Router JSON-parses search values that look like objects/arrays. */
function jsonStringParam() {
  return z
    .unknown()
    .transform((value) => {
      if (typeof value === 'string') return value
      if (value && typeof value === 'object') return JSON.stringify(value)
      return ''
    })
    .catch('')
}

/** Keep URL params as `"0"|"1"` so TanStack Router search patches type-check globally. */
const trueParam = z.enum(['0', '1']).catch('1')

export const presetBuilderSearchSchema = z.object({
  pb_name: z.string().catch(''),
  pb_icon: z.string().catch(''),
  pb_searchable: trueParam,
  pb_tags: jsonStringParam(),
  pb_geometry: jsonStringParam(),
  pb_fields: jsonStringParam(),
  pb_moreFields: jsonStringParam(),
  pb_terms: jsonStringParam(),
  pb_aliases: jsonStringParam(),
  pb_addTags: jsonStringParam(),
  pb_removeTags: jsonStringParam(),
  pb_matchScore: z.string().catch(''),
  pb_referenceKey: z.string().catch(''),
  pb_referenceValue: z.string().catch(''),
  pb_locationInclude: z.string().catch(''),
  pb_locationExclude: z.string().catch(''),
  pb_locationSetCrossReference: z.string().catch(''),
  pb_relation: z.string().catch(''),
  pb_relationCrossReference: z.string().catch(''),
  pb_draftFields: jsonStringParam(),
  pb_from: z.string().catch(''),
})

export type PresetBuilderSearch = z.infer<typeof presetBuilderSearchSchema>

export const presetBuilderSearchDefaults: PresetBuilderSearch = presetBuilderSearchSchema.parse({})

export function searchToBuilderState(search: PresetBuilderSearch): PresetBuilderState {
  return {
    name: search.pb_name,
    icon: search.pb_icon,
    searchable: search.pb_searchable === '1',
    tags: parseTagObject(search.pb_tags),
    geometry: parseStringList(search.pb_geometry),
    fields: parseStringList(search.pb_fields),
    moreFields: parseStringList(search.pb_moreFields),
    terms: parseStringList(search.pb_terms),
    aliases: parseStringList(search.pb_aliases),
    addTags: parseTagObject(search.pb_addTags),
    removeTags: parseTagObject(search.pb_removeTags),
    matchScore: search.pb_matchScore,
    referenceKey: search.pb_referenceKey,
    referenceValue: search.pb_referenceValue,
    locationSetInclude: parseStringList(search.pb_locationInclude),
    locationSetExclude: parseStringList(search.pb_locationExclude),
    locationSetCrossReference: search.pb_locationSetCrossReference,
    relation: search.pb_relation,
    relationCrossReference: search.pb_relationCrossReference,
    draftFields: parseDraftFields(search.pb_draftFields),
  }
}

export function builderStateToSearch(
  state: PresetBuilderState,
  fromPresetId = '',
): PresetBuilderSearch {
  return {
    pb_name: state.name,
    pb_icon: state.icon,
    pb_searchable: state.searchable ? '1' : '0',
    pb_tags: stringifyTagObject(state.tags),
    pb_geometry: stringifyStringList(state.geometry),
    pb_fields: stringifyStringList(state.fields),
    pb_moreFields: stringifyStringList(state.moreFields),
    pb_terms: stringifyStringList(state.terms),
    pb_aliases: stringifyStringList(state.aliases),
    pb_addTags: stringifyTagObject(state.addTags),
    pb_removeTags: stringifyTagObject(state.removeTags),
    pb_matchScore: state.matchScore,
    pb_referenceKey: state.referenceKey,
    pb_referenceValue: state.referenceValue,
    pb_locationInclude: stringifyStringList(state.locationSetInclude),
    pb_locationExclude: stringifyStringList(state.locationSetExclude),
    pb_locationSetCrossReference: state.locationSetCrossReference,
    pb_relation: state.relation,
    pb_relationCrossReference: state.relationCrossReference,
    pb_draftFields: stringifyDraftFields(state.draftFields),
    pb_from: fromPresetId,
  }
}

export function builderStateToSearchPatch(
  patch: Partial<PresetBuilderState>,
  current: PresetBuilderState,
  fromPresetId = '',
): Partial<PresetBuilderSearch> {
  return builderStateToSearch({ ...current, ...patch }, fromPresetId)
}
