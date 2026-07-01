/**
 * Runtime schema dereferencing for id-tagging-schema v6 dist files.
 *
 * schema-builder v7 (PR #281) dereferences references at build time, so downstream
 * apps no longer receive `{…}` refs, stringsCrossReference, or iconsCrossReference.
 * When this project switches to v7 dist output, delete this folder and remove the
 * calls from dataLoader.ts and LocaleContext (via SchemaContext).
 *
 * Logic is ported from ideditor/schema-builder lib/references.js (PR #281).
 */

import { collectReferences } from "@/schemaRuntimeDereference/collectReferences";
import {
  type References,
  type TranslatableStrings,
  dereferenceUntranslatedFieldContent,
  dereferencedTranslatableContent,
  isReference,
} from "@/schemaRuntimeDereference/references";
import type { RawFields, RawPresets, RawTranslations } from "@/utils/types";

export { isReference, type References, type TranslatableStrings };

export function getTranslatableStrings(
  translations: RawTranslations,
  locale = "en",
): TranslatableStrings {
  const block = translations[locale as keyof RawTranslations]?.presets;
  return {
    presets: block?.presets,
    fields: block?.fields,
  };
}

/** True when dist JSON still contains references that v7 would strip at build time. */
export function needsRuntimeDereference(fields: RawFields, presets: RawPresets): boolean {
  for (const field of Object.values(fields)) {
    if (field.stringsCrossReference) return true;
    if (field.label && isReference(field.label)) return true;
    if (field.placeholder && isReference(field.placeholder)) return true;
    if (field.iconsCrossReference) return true;
  }

  for (const preset of Object.values(presets)) {
    const raw = preset as Record<string, unknown>;
    const name = raw.name ?? raw.originalName;
    if (typeof name === "string" && isReference(name)) return true;
  }

  return false;
}

export function dereferenceLocaleStrings(
  tstrings: TranslatableStrings,
  references: References,
): void {
  dereferencedTranslatableContent(tstrings, references, false);
}

/**
 * Apply runtime dereferencing to a freshly loaded schema payload (mutates in place).
 * Preset `fields`/`moreFields` refs are left intact for PresetSourceTree symlink UX.
 */
export function applyRuntimeDereference(payload: {
  fields: RawFields;
  presets: RawPresets;
  translations: RawTranslations;
}): References | null {
  if (!needsRuntimeDereference(payload.fields, payload.presets)) {
    return null;
  }

  const enStrings = getTranslatableStrings(payload.translations);
  const references = collectReferences(payload.fields, payload.presets, enStrings);

  for (const locale of Object.keys(payload.translations)) {
    const tstrings = getTranslatableStrings(payload.translations, locale);
    if (tstrings.presets || tstrings.fields) {
      dereferenceLocaleStrings(tstrings, references);
    }
  }

  dereferenceUntranslatedFieldContent(payload.fields);
  return references;
}
