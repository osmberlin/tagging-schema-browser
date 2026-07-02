import { describe, expect, it } from 'vitest'
import { ensureIconSupplier, getIconSvgDataUrl } from './iconRegistry'

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
