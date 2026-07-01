/**
 * Runtime reference dereferencing ported from ideditor/schema-builder PR #281
 * (lib/references.js). See schemaRuntimeDereference/index.ts for removal notes.
 */

import type { FieldTranslations, RawFields, RawPresets } from '@/utils/types'

export type FieldReferences = {
  labelAndTerms?: string
  placeholder?: string
  stringsCrossReference?: string
  options?: Record<string, Record<string, string>>
}

export type PresetReferences = {
  nameTermsAliases?: string
}

export type References = {
  fields: Record<string, FieldReferences>
  presets: Record<string, PresetReferences>
}

export type TranslatableStrings = {
  presets?: Record<string, { name?: string; terms?: string; aliases?: string }>
  fields?: FieldTranslations
}

/** `{path/to/id}` reference syntax used by id-tagging-schema. */
export function isReference(string: string): boolean {
  return string.startsWith('{') && string.endsWith('}')
}

/**
 * Expands references to non-translatable field content (e.g. iconsCrossReference).
 * Preset field-list expansion is intentionally omitted here so PresetSourceTree can
 * still show `{preset}` symlinks in source JSON; see index.ts.
 */
export function dereferenceUntranslatedFieldContent(fields: RawFields): void {
  for (const fieldID in fields) {
    const field = fields[fieldID]
    if (!field.iconsCrossReference) continue

    const referencedField = fields[field.iconsCrossReference.slice(1, -1)]
    if (!referencedField) {
      throw new Error(
        `Field "${fieldID}" references "${field.iconsCrossReference}" in iconsCrossReference, but there is no such field.`,
      )
    }

    field.icons = referencedField.icons
    field.iconsCrossReference = undefined
  }
}

/** Expands preset `fields` / `moreFields` references like schema-builder v7 dist output. */
export function dereferenceUntranslatedPresetContent(presets: RawPresets): void {
  for (const presetID in presets) {
    const preset = presets[presetID] as {
      fields?: string[]
      moreFields?: string[]
    }

    for (const prop of ['fields', 'moreFields'] as const) {
      const list = preset[prop]
      if (!list) continue

      for (let i = 0; i < list.length; i++) {
        const otherPresetID = list[i]
        if (!isReference(otherPresetID)) continue

        const referencedPreset = presets[otherPresetID.slice(1, -1)] as
          | { fields?: string[]; moreFields?: string[] }
          | undefined

        if (!referencedPreset) {
          throw new Error(
            `Preset "${presetID}" references "${otherPresetID}" in ${prop}.${i}, but there is no such preset.`,
          )
        }

        if (!referencedPreset[prop]) {
          list.splice(i--, 1)
          continue
        }

        list.splice(i--, 1, ...referencedPreset[prop])
      }
    }
  }
}

/** Copies translated strings to presets/fields that reference other entries. */
export function dereferencedTranslatableContent(
  tstrings: TranslatableStrings,
  references: References,
  strict: boolean,
): void {
  for (const presetID in references.presets) {
    if (!tstrings.presets?.[presetID]) continue

    const p = references.presets[presetID]
    if (p.nameTermsAliases) {
      const referencedPreset = tstrings.presets[p.nameTermsAliases.slice(1, -1)]

      if (referencedPreset) {
        tstrings.presets[presetID].name = referencedPreset.name
        tstrings.presets[presetID].aliases = referencedPreset.aliases
        tstrings.presets[presetID].terms = referencedPreset.terms
      } else if (strict) {
        throw new Error(
          `Preset "${presetID}" references "${p.nameTermsAliases}" in the name, but there is no such preset.`,
        )
      }
    }
  }

  for (const fieldID in references.fields) {
    if (!tstrings.fields?.[fieldID]) continue

    const f = references.fields[fieldID]

    if (f.labelAndTerms) {
      const referencedField = tstrings.fields[f.labelAndTerms.slice(1, -1)]

      if (referencedField) {
        tstrings.fields[fieldID].label = referencedField.label
        tstrings.fields[fieldID].terms = referencedField.terms
      } else if (strict) {
        throw new Error(
          `Field "${fieldID}" references "${f.labelAndTerms}" in the label, but there is no such field.`,
        )
      }
    }

    if (f.placeholder) {
      const referencedField = tstrings.fields[f.placeholder.slice(1, -1)]

      if (referencedField) {
        tstrings.fields[fieldID].placeholder = referencedField.placeholder
      } else if (strict) {
        throw new Error(
          `Field "${fieldID}" references "${f.placeholder}" in the placeholder, but there is no such field.`,
        )
      }
    }

    if (f.stringsCrossReference) {
      const referencedField = tstrings.fields[f.stringsCrossReference.slice(1, -1)]

      if (referencedField) {
        const target = tstrings.fields[fieldID]
        for (const prop in referencedField) {
          const value = referencedField[prop as keyof typeof referencedField]
          if (value === undefined) continue
          if (typeof value === 'object') {
            ;(target as Record<string, unknown>)[prop] = value
          } else if (
            typeof value === 'string' &&
            (target[prop as keyof typeof target] === undefined ||
              target[prop as keyof typeof target] === '')
          ) {
            ;(target as Record<string, unknown>)[prop] = value
          }
        }
      } else if (strict) {
        throw new Error(
          `Field "${fieldID}" references "${f.stringsCrossReference}" in stringsCrossReference, but there is no such field.`,
        )
      }
    }

    if (f.options) {
      for (const prop in f.options) {
        for (const key in f.options[prop]) {
          const [type, ...foreignId] = f.options[prop][key].slice(1, -1).split('/')
          const referenced =
            type === 'presets'
              ? tstrings.presets?.[foreignId.join('/')]?.name
              : type === 'fields'
                ? tstrings.fields?.[foreignId.join('/')]?.label
                : undefined

          if (referenced) {
            if (!tstrings.fields[fieldID].options) {
              tstrings.fields[fieldID].options = {}
            }
            tstrings.fields[fieldID].options[key] = referenced
          } else if (strict) {
            throw new Error(
              `Field "${fieldID}" references "${foreignId.join('/')}" in options.${prop}.${key}, but there is no such ${type}.`,
            )
          }
        }
      }
    }
  }
}
