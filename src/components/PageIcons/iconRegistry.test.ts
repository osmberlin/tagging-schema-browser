import { describe, expect, it } from 'vitest'
import {
  ensureIconSupplier,
  getIconSvgDataUrl,
  isIconSupplierLoaded,
  subscribeIconRegistry,
} from './iconRegistry'

describe('iconRegistry supplier loading', () => {
  it('reports supplier as loaded in registry listeners after ensureIconSupplier', async () => {
    const seenReady: boolean[] = []
    const unsub = subscribeIconRegistry(() => {
      seenReady.push(isIconSupplierLoaded('roentgen'))
    })

    await ensureIconSupplier('roentgen')

    expect(isIconSupplierLoaded('roentgen')).toBe(true)
    expect(seenReady.at(-1)).toBe(true)
    unsub()
  })
})

describe('iconRegistry iD field sprites', () => {
  it('loads crossing_markings option icons referenced by the schema', async () => {
    await ensureIconSupplier('iD')

    for (const name of [
      'iD-crossing_markings-zebra',
      'iD-crossing_markings-dots',
      'iD-crossing_markings-ladder_skewed',
    ]) {
      expect(getIconSvgDataUrl(name), name).toMatch(/^data:image\/svg\+xml/)
    }
  })
})
