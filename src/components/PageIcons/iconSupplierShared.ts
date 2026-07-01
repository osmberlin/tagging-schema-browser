import { type IconDefinition, icon } from '@fortawesome/fontawesome-svg-core'
import type { IconRegistryEntry } from '@/utils/types'

export type RawGlobMap = Record<string, string>

export function normalizeIconBase(name: string): string {
  // Maki ships some icons with size suffixes, keep canonical names.
  return name.replace(/-(11|15)$/, '')
}

export function buildSetEntries(prefix: string, paths: RawGlobMap): IconRegistryEntry[] {
  const byName = new Map<string, IconRegistryEntry>()
  for (const [filepath, raw] of Object.entries(paths)) {
    const file = filepath.split('/').pop() ?? ''
    const base = normalizeIconBase(file.replace(/\.svg$/, ''))
    const name = `${prefix}-${base}`
    if (!byName.has(name)) {
      byName.set(name, { name, prefix, svgRaw: raw })
    }
  }
  return Array.from(byName.values())
}

function fontAwesomeStringAliases(definition: IconDefinition): string[] {
  const ligatures = definition.icon[2]
  if (!Array.isArray(ligatures)) return []
  return ligatures.filter((alias): alias is string => typeof alias === 'string')
}

export function buildFontAwesomeEntries(
  prefix: 'fas' | 'far' | 'fab',
  source: Record<string, unknown>,
): IconRegistryEntry[] {
  const byName = new Map<string, IconRegistryEntry>()
  for (const value of Object.values(source)) {
    if (!value || typeof value !== 'object') continue
    const maybe = value as Partial<IconDefinition>
    if (!maybe.iconName || !maybe.prefix || !maybe.icon) continue
    if (
      (prefix === 'fas' && maybe.prefix !== 'fas') ||
      (prefix === 'far' && maybe.prefix !== 'far') ||
      (prefix === 'fab' && maybe.prefix !== 'fab')
    ) {
      continue
    }
    try {
      let rendered = icon(maybe as IconDefinition).html?.[0]
      if (!rendered) continue
      // FontAwesome renders inline SVG without the xmlns namespace, which makes
      // the resulting `data:image/svg+xml` URL an invalid standalone document
      // (the <img> renders broken). Inject the namespace so it loads.
      if (!rendered.includes('xmlns')) {
        rendered = rendered.replace(/^<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"')
      }
      const addEntry = (name: string) => {
        if (!byName.has(name)) {
          byName.set(name, { name, prefix, svgRaw: rendered })
        }
      }
      addEntry(`${prefix}-${maybe.iconName}`)
      for (const alias of fontAwesomeStringAliases(maybe as IconDefinition)) {
        if (alias !== maybe.iconName) {
          addEntry(`${prefix}-${alias}`)
        }
      }
    } catch {
      // Skip invalid exported values.
    }
  }
  return Array.from(byName.values())
}
