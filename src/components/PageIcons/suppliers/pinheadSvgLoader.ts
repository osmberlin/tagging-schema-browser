import type { IconRegistryEntry } from '@/utils/types'
import { pinheadIdFromIconName, resolvePinheadId } from './pinheadCatalogSupplier'

const pinheadSvgLoaders = import.meta.glob<string>(
  '/node_modules/@waysidemapping/pinhead/dist/icons/*.svg',
  { eager: false, import: 'default', query: '?raw' },
)

// Glob instead of import: Pinhead < 16 ships no id_upgrades.json.
const pinheadUpgrades: Record<string, string> =
  Object.values(
    import.meta.glob<Record<string, string>>(
      '/node_modules/@waysidemapping/pinhead/dist/id_upgrades.json',
      { eager: true, import: 'default' },
    ),
  )[0] ?? {}

const loaderById = new Map<string, () => Promise<string>>()
for (const [path, loader] of Object.entries(pinheadSvgLoaders)) {
  const file = path.split('/').pop() ?? ''
  const id = file.replace(/\.svg$/, '')
  if (id) loaderById.set(id, loader)
}
const availableIds: ReadonlySet<string> = new Set(loaderById.keys())

/** Load one Pinhead SVG from the bundled package (separate Vite chunk per file). */
export async function loadPinheadSvg(iconName: string): Promise<IconRegistryEntry | null> {
  const id = pinheadIdFromIconName(iconName)
  if (!id) return null

  const bundledId = resolvePinheadId(id, availableIds, pinheadUpgrades)
  const loader = bundledId ? loaderById.get(bundledId) : undefined
  if (!loader) return null

  const svgRaw = await loader()
  if (!svgRaw.trim().startsWith('<')) return null

  return { name: iconName, prefix: 'pinhead', svgRaw }
}
