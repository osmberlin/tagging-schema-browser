import { type References, dereferenceLocaleStrings } from '@/schemaRuntimeDereference'
import { isBundledTestSchemaUrl } from '@/utils/constants'
import { fetchSchemaJson } from '@/utils/schemaFetch'
import type { FieldTranslations } from '@/utils/types'

export type LocaleEntry = { name?: string; terms: string[]; aliases: string[] }
export type LocaleMap = Map<string, LocaleEntry>

/** Reasonable fallback when locales can't be discovered from the dist host. */
const FALLBACK_LOCALES = [
  'en-GB',
  'de',
  'fr',
  'es',
  'it',
  'nl',
  'pl',
  'pt',
  'pt-BR',
  'ru',
  'uk',
  'cs',
  'sk',
  'sv',
  'da',
  'nb',
  'fi',
  'ja',
  'ko',
  'zh-CN',
  'zh-TW',
  'tr',
  'hu',
  'ro',
  'el',
  'ca',
  'eu',
  'gl',
  'he',
  'ar',
  'fa',
  'id',
  'vi',
  'th',
]

function ensureSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

function parseTerms(s?: string): string[] {
  return (s ?? '')
    .toLowerCase()
    .trim()
    .split(/\s*,+\s*/)
    .filter(Boolean)
}

function parseAliases(s?: string): string[] {
  return (s ?? '').trim() ? (s as string).split(/\s*[\r\n]+\s*/).filter(Boolean) : []
}

type JsDelivrNode = { type: string; name: string; files?: JsDelivrNode[] }

function findDir(nodes: JsDelivrNode[] | undefined, name: string): JsDelivrNode | undefined {
  return nodes?.find((n) => n.type === 'directory' && n.name === name)
}

async function discoverLocalesFromJsDelivr(pkg: string, version: string): Promise<string[] | null> {
  try {
    let resolvedVersion = version
    if (!/^\d/.test(version)) {
      const r = await fetch(
        `https://data.jsdelivr.com/v1/packages/npm/${pkg}/resolved?specifier=${encodeURIComponent(version)}`,
      )
      if (r.ok) resolvedVersion = ((await r.json()) as { version?: string }).version ?? version
    }
    const res = await fetch(`https://data.jsdelivr.com/v1/packages/npm/${pkg}@${resolvedVersion}`)
    if (!res.ok) return null
    const json = (await res.json()) as { files?: JsDelivrNode[] }
    const dist = findDir(json.files, 'dist')
    const translations = findDir(dist?.files, 'translations')
    const locales = (translations?.files ?? [])
      .filter((f) => f.type === 'file' && f.name.endsWith('.min.json'))
      .map((f) => f.name.replace(/\.min\.json$/, ''))
      .filter((code) => code !== 'en')
    if (locales.length) return locales.sort((a, b) => a.localeCompare(b))
  } catch {
    return null
  }
  return null
}

/** Discover locale codes from the dist's translations/ folder. */
export async function discoverLocales(dataUrl: string): Promise<string[]> {
  try {
    const manifestRes = await fetch(`${ensureSlash(dataUrl)}translations/locales.json`)
    if (manifestRes.ok) {
      const list = (await manifestRes.json()) as string[]
      return list.filter((code) => code !== 'en').sort((a, b) => a.localeCompare(b))
    }
  } catch {
    // continue
  }

  if (isBundledTestSchemaUrl(dataUrl)) {
    return []
  }

  const match = dataUrl.match(/cdn\.jsdelivr\.net\/npm\/(.+?)@([^/]+)\//)
  if (match) {
    const pkg = match[1]
    const version = match[2]
    if (pkg && version) {
      const fromCdn = await discoverLocalesFromJsDelivr(pkg, version)
      if (fromCdn) return fromCdn
    }
  }

  return FALLBACK_LOCALES
}

async function loadLocale(
  dataUrl: string,
  locale: string,
  schemaReferences: References | null,
): Promise<{ presets: LocaleMap; fields: FieldTranslations }> {
  const res = await fetchSchemaJson<
    Record<
      string,
      {
        presets?: {
          presets?: Record<string, { name?: string; terms?: string; aliases?: string }>
          fields?: FieldTranslations
        }
      }
    >
  >(`${ensureSlash(dataUrl)}translations/${locale}.min.json`)
  const json = res
  const tstrings = {
    presets: json[locale]?.presets?.presets ?? {},
    fields: json[locale]?.presets?.fields ?? {},
  }
  if (schemaReferences) {
    dereferenceLocaleStrings(tstrings, schemaReferences)
  }

  const map: LocaleMap = new Map()
  for (const [id, value] of Object.entries(tstrings.presets)) {
    map.set(id, {
      name: value.name,
      terms: parseTerms(value.terms),
      aliases: parseAliases(value.aliases),
    })
  }
  return { presets: map, fields: tstrings.fields }
}

export const localeKeys = {
  all: ['locale'] as const,
  list: (url: string) => [...localeKeys.all, 'list', url] as const,
  translations: (url: string, locale: string) =>
    [...localeKeys.all, 'translations', url, locale] as const,
}

export async function fetchLocales(dataUrl: string): Promise<string[]> {
  return discoverLocales(dataUrl)
}

export async function fetchLocaleTranslations(
  dataUrl: string,
  locale: string,
  schemaReferences: References | null,
): Promise<{ map: LocaleMap; fieldMap: FieldTranslations }> {
  const { presets, fields } = await loadLocale(dataUrl, locale, schemaReferences)
  return { map: presets, fieldMap: fields }
}
