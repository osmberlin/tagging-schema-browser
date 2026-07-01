import { type RawGlobMap, buildSetEntries } from '../iconSupplierShared'

export async function loadRoentgenEntries() {
  const paths = import.meta.glob('/node_modules/@enzet/roentgen/icons/*.svg', {
    eager: true,
    import: 'default',
    query: '?raw',
  }) as RawGlobMap
  return buildSetEntries('roentgen', paths)
}
