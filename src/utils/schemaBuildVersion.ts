import { needsRuntimeDereference } from '@/schemaRuntimeDereference'
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
  options?: { resolvedReleaseVersion?: string | null },
): string {
  const major = build.major ?? SUPPORTED_SCHEMA_MAJOR
  const spec = build.versionSpec
  if (spec && spec !== 'latest') return `v${spec}`
  if (spec === 'latest' && options?.resolvedReleaseVersion) {
    return `v${options.resolvedReleaseVersion}`
  }
  if (build.detection === 'content' && !spec) return `v${major}`
  return `v${major}`
}

export function isLegacySearchParam(value: string | undefined): boolean {
  return value === '1' || value === 'true'
}

export function unsupportedSchemaBuildMessage(build: SchemaBuildInfo): string {
  const label = formatSchemaBuildLabel(build)
  return `This schema build is ${label}. Tagging Schema Browser supports v${SUPPORTED_SCHEMA_MAJOR}+ only. Add ?legacy=1 to load older builds.`
}

export function isSchemaBuildAllowed(
  build: SchemaBuildInfo,
  options: { allowLegacy: boolean; dataUrl: string },
): boolean {
  if (isBundledTestSchemaUrl(options.dataUrl)) return true
  if (build.major === null || build.major >= SUPPORTED_SCHEMA_MAJOR) return true
  return options.allowLegacy
}
