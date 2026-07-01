import { presetIdFromRef } from '@/components/PagePresets/presetFieldInheritance'
import type { DenormalizedPreset, RawPresets } from '@/utils/types'

export type ResolvedLabels = {
  name: string
  terms: string[]
  aliases: string[]
}

/** Preset id referenced by `originalName` or `name` when it uses `{preset}` syntax. */
export function nameRefFromRaw(raw: Record<string, unknown>): string | null {
  const ref = raw.originalName ?? raw.name
  if (typeof ref !== 'string') return null
  return presetIdFromRef(ref)
}

/** Final preset id whose labels are inherited for a `name: "{…}"` reference. */
export function resolveLabelSourcePresetId(
  nameRef: string,
  rawPresets: RawPresets,
  seen = new Set<string>(),
): string | null {
  const id = presetIdFromRef(nameRef)
  if (!id || seen.has(id)) return null
  seen.add(id)

  const raw = rawPresets[id]
  if (!raw) return null

  const nestedId = nameRefFromRaw(raw as Record<string, unknown>)
  if (nestedId) {
    return resolveLabelSourcePresetId(`{${nestedId}}`, rawPresets, seen)
  }
  return id
}

/** Effective name, terms, and aliases inherited via `name: "{preset}"`. */
export function getInheritedLabels(
  nameRef: string,
  rawPresets: RawPresets,
  presetsById: Map<string, DenormalizedPreset>,
): ResolvedLabels | null {
  const sourceId = resolveLabelSourcePresetId(nameRef, rawPresets)
  if (!sourceId) return null

  const preset = presetsById.get(sourceId)
  if (!preset) return null

  return {
    name: preset.name,
    terms: preset.terms,
    aliases: preset.aliases,
  }
}
