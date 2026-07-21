import type { PresetBuilderState } from '@/components/PagePresetBuilder/presetBuilderTypes'
import { PRESET_BUILDER_DEFAULTS } from '@/components/PagePresetBuilder/presetBuilderTypes'

export type BuilderSectionId =
  | 'labels'
  | 'appearance'
  | 'geometry'
  | 'fields'
  | 'moreFields'
  | 'tagOverrides'
  | 'matchScore'
  | 'reference'
  | 'locationSet'
  | 'relation'
  | 'preview'
  | 'export'

const SECTION_FIELDS: Record<BuilderSectionId, readonly (keyof PresetBuilderState)[]> = {
  labels: ['name', 'terms', 'aliases'],
  appearance: ['icon'],
  geometry: ['geometry'],
  fields: ['fields'],
  moreFields: ['moreFields'],
  tagOverrides: ['addTags', 'removeTags'],
  matchScore: ['matchScore'],
  reference: ['referenceKey', 'referenceValue'],
  locationSet: ['locationSetInclude', 'locationSetExclude', 'locationSetCrossReference'],
  relation: ['relation', 'relationCrossReference'],
  preview: [],
  export: [],
}

function fieldDiffersFromDefault<K extends keyof PresetBuilderState>(
  state: PresetBuilderState,
  key: K,
): boolean {
  return JSON.stringify(state[key]) !== JSON.stringify(PRESET_BUILDER_DEFAULTS[key])
}

/** True when any field in the section differs from builder defaults (e.g. URL-loaded values). */
export function sectionOpenWhen(section: BuilderSectionId, state: PresetBuilderState): boolean {
  return SECTION_FIELDS[section].some((key) => fieldDiffersFromDefault(state, key))
}

export const BUILDER_SECTION_META: Record<
  BuilderSectionId,
  { title: string; description: string }
> = {
  labels: {
    title: 'Labels',
    description:
      'Display name goes in translation files. Use {parent} to inherit from a slash-parent preset.',
  },
  appearance: {
    title: 'Appearance',
    description: 'Pick an icon name from the Icons page. imageURL is not offered here.',
  },
  geometry: {
    title: 'Geometry',
    description: 'Where this preset can be used in the editor.',
  },
  fields: {
    title: 'Fields',
    description:
      'One entry per line. Use field ids or preset refs like {shop} to include a parent list.',
  },
  moreFields: {
    title: 'moreFields',
    description: 'Additional fields shown after the main field list.',
  },
  tagOverrides: {
    title: 'Tag overrides',
    description: 'addTags and removeTags applied when this preset is used.',
  },
  matchScore: {
    title: 'matchScore',
    description: 'Optional ranking weight when multiple presets match (default 1).',
  },
  reference: {
    title: 'reference',
    description: 'Link this preset to an external reference key/value pair.',
  },
  locationSet: {
    title: 'locationSet',
    description: 'Limit the preset to specific countries or regions.',
  },
  relation: {
    title: 'relation',
    description: 'Relation preset type and cross-reference for inherited presets.',
  },
  preview: {
    title: 'Preview',
    description: 'How the preset will look in the browser.',
  },
  export: {
    title: 'Export',
    description:
      'Copy JSON into your id-tagging-schema pull request. English labels go in translations.',
  },
}
