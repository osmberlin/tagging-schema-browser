import { type RawGlobMap, buildSetEntries } from '../iconSupplierShared'

export async function loadIdPresetEntries() {
  const paths = {
    ...import.meta.glob('../../../icons/id-sprite-presets/*.svg', {
      eager: true,
      import: 'default',
      query: '?raw',
    }),
    // Field option icons live under svg/iD-sprite/fields/ in iD (not presets/).
    ...import.meta.glob('../../../icons/id-sprite-fields/crossing_markings/*.svg', {
      eager: true,
      import: 'default',
      query: '?raw',
    }),
  } as RawGlobMap
  return buildSetEntries('iD', paths)
}
