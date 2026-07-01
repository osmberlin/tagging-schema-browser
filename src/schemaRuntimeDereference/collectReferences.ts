import {
  type References,
  type TranslatableStrings,
  isReference,
} from '@/schemaRuntimeDereference/references'
import type { FieldTranslations, RawFields, RawPresets } from '@/utils/types'

/** Reconstruct the references map from v6 dist JSON (schema-builder builds this at compile time). */
export function collectReferences(
  fields: RawFields,
  presets: RawPresets,
  tstrings?: TranslatableStrings,
): References {
  const references: References = { fields: {}, presets: {} }

  for (const [fieldID, field] of Object.entries(fields)) {
    if (field.label && isReference(field.label)) {
      references.fields[fieldID] ??= {}
      references.fields[fieldID].labelAndTerms = field.label
    }

    if (field.placeholder && isReference(field.placeholder)) {
      references.fields[fieldID] ??= {}
      references.fields[fieldID].placeholder = field.placeholder
    }

    if (field.stringsCrossReference) {
      references.fields[fieldID] ??= {}
      references.fields[fieldID].stringsCrossReference = field.stringsCrossReference
    }
  }

  for (const [presetID, preset] of Object.entries(presets)) {
    const raw = preset as Record<string, unknown>
    const name = raw.name ?? raw.originalName
    if (typeof name === 'string' && isReference(name)) {
      references.presets[presetID] ??= {}
      references.presets[presetID].nameTermsAliases = name
    }
  }

  if (tstrings?.fields) {
    scanFieldTranslationRefs(tstrings.fields, references)
  }

  return references
}

function scanFieldTranslationRefs(fields: FieldTranslations, references: References): void {
  for (const [fieldID, translation] of Object.entries(fields)) {
    for (const [prop, value] of Object.entries(translation)) {
      if (prop === 'label' || prop === 'terms' || prop === 'placeholder') continue
      if (!value || typeof value !== 'object') continue

      for (const [key, optValue] of Object.entries(value as Record<string, unknown>)) {
        if (typeof optValue === 'string' && isReference(optValue)) {
          references.fields[fieldID] ??= {}
          const fieldRefs = references.fields[fieldID]
          if (!fieldRefs.options) fieldRefs.options = {}
          if (!fieldRefs.options[prop]) fieldRefs.options[prop] = {}
          fieldRefs.options[prop][key] = optValue
        }
      }
    }
  }
}
