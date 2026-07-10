import { isBundledTestSchemaUrl } from '@/utils/constants'
import type { RawFields, RawPresets, RawTranslations } from '@/utils/types'

export const SUPPORTED_SCHEMA_MAJOR = 7

export type SchemaBuildInfo = {
  major: number | null
  /** npm tag/spec from the URL, when present (e.g. `7.0.1`, `latest`). */
  versionSpec: string | null
  detection: 'url' | 'content'
}

type SchemaBuildPayload = {
  presets: RawPresets
  fields: RawFields
  translations: RawTranslations
}

/** npm version tag/spec from a jsDelivr `dataUrl`, if any. */
export function versionSpecFromDataUrl(dataUrl: string): string | null {
  const npmMatch = dataUrl.match(/@openstreetmap\/id-tagging-schema@([^/]+)/)
  return npmMatch?.[1] ?? null
}

export function majorFromVersionSpec(spec: string): number | null {
  if (spec === 'latest') return null
  const match = spec.match(/^(\d+)/)
  return match ? Number.parseInt(match[1], 10) : null
}

export function predictSchemaBuildFromUrl(dataUrl: string): SchemaBuildInfo | null {
  const versionSpec = versionSpecFromDataUrl(dataUrl)
  if (!versionSpec) return null
  const major = majorFromVersionSpec(versionSpec)
  if (major === null) return null
  return { major, versionSpec, detection: 'url' }
}

function isReference(value: unknown): value is string {
  return typeof value === 'string' && /^\{.+\}$/.test(value)
}

/** True when dist JSON still contains references stripped by schema-builder v7. */
function needsRuntimeDereference(fields: RawFields, presets: RawPresets): boolean {
  for (const field of Object.values(fields)) {
    if (field.stringsCrossReference) return true
    if (field.label && isReference(field.label)) return true
    if (field.placeholder && isReference(field.placeholder)) return true
    if (field.iconsCrossReference) return true
  }

  for (const preset of Object.values(presets)) {
    const raw = preset as Record<string, unknown>
    const name = raw.name ?? raw.originalName
    if (typeof name === 'string' && isReference(name)) return true
  }

  return false
}

function detectMajorFromContent(payload: SchemaBuildPayload): number {
  if (needsRuntimeDereference(payload.fields, payload.presets)) return 6

  const presetStrings = Object.values(payload.translations.en?.presets?.presets ?? {})
  for (const entry of presetStrings) {
    if (Array.isArray(entry.terms)) return SUPPORTED_SCHEMA_MAJOR
    if (typeof entry.terms === 'string' && entry.terms.length > 0) return 6
  }

  for (const entry of presetStrings) {
    if (Array.isArray(entry.aliases)) return SUPPORTED_SCHEMA_MAJOR
    if (typeof entry.aliases === 'string' && entry.aliases.length > 0) return 6
  }

  return SUPPORTED_SCHEMA_MAJOR
}

export function detectSchemaBuildInfo(
  dataUrl: string,
  payload: SchemaBuildPayload,
): SchemaBuildInfo {
  const versionSpec = versionSpecFromDataUrl(dataUrl)
  const majorFromUrl = versionSpec ? majorFromVersionSpec(versionSpec) : null

  if (majorFromUrl !== null) {
    return { major: majorFromUrl, versionSpec, detection: 'url' }
  }

  return {
    major: detectMajorFromContent(payload),
    versionSpec,
    detection: 'content',
  }
}

export function formatSchemaBuildLabel(
  build: SchemaBuildInfo,
  options?: { resolvedReleaseVersion?: string | null; stagingAge?: string | null },
): string {
  const major = build.major ?? SUPPORTED_SCHEMA_MAJOR
  const spec = build.versionSpec
  if (spec && spec !== 'latest') return `v${spec}`
  if (spec === 'latest' && options?.resolvedReleaseVersion) {
    return `v${options.resolvedReleaseVersion}`
  }
  if (build.detection === 'content' && !spec) {
    const age = options?.stagingAge?.trim()
    return age ? `${major}-latest (${age})` : `${major}-latest`
  }
  return `v${major}`
}

export function isSchemaBuildSupported(build: SchemaBuildInfo, dataUrl: string): boolean {
  if (isBundledTestSchemaUrl(dataUrl)) return true
  if (build.major === null || build.major >= SUPPORTED_SCHEMA_MAJOR) return true
  return false
}

export function unsupportedSchemaBuildMessage(build: SchemaBuildInfo): string {
  const label = formatSchemaBuildLabel(build)
  return `The linked schema is ${label}. This browser only supports id-tagging-schema v${SUPPORTED_SCHEMA_MAJOR} and newer, so that dataset cannot be shown here.`
}
