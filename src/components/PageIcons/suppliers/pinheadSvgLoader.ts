import type { IconRegistryEntry } from '@/utils/types'
import { pinheadIdFromIconName } from './pinheadCatalogSupplier'

const pinheadSvgLoaders = import.meta.glob<string>(
  '/node_modules/@waysidemapping/pinhead/dist/icons/*.svg',
  { eager: false, import: 'default', query: '?raw' },
)

const loaderById = new Map<string, () => Promise<string>>()
for (const [path, loader] of Object.entries(pinheadSvgLoaders)) {
  const file = path.split('/').pop() ?? ''
  const id = file.replace(/\.svg$/, '')
  if (id) loaderById.set(id, loader)
}

/** Load one Pinhead SVG from the bundled package (separate Vite chunk per file). */
export async function loadPinheadSvg(iconName: string): Promise<IconRegistryEntry | null> {
  const id = pinheadIdFromIconName(iconName)
  if (!id) return null

  const loader = loaderById.get(id)
  if (!loader) return null

  const svgRaw = await loader()
  if (!svgRaw.trim().startsWith('<')) return null

  return { name: iconName, prefix: 'pinhead', svgRaw }
}
