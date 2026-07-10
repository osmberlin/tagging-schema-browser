import { describe, expect, it } from 'vitest'
import {
  ensureIconSupplier,
  ensureIconsForNames,
  getIconRegistry,
  getIconSvgDataUrl,
  isIconSvgConfirmedMissing,
} from '@/components/PageIcons/iconRegistry'

describe('isIconSvgConfirmedMissing pinhead icons', () => {
  it('does not mark pinhead icons broken before SVG chunk loads', async () => {
    await ensureIconSupplier('pinhead')

    expect(isIconSvgConfirmedMissing('pinhead-a_frame_tent')).toBe(false)

    const pending = ensureIconsForNames(['pinhead-a_frame_tent'])
    expect(isIconSvgConfirmedMissing('pinhead-a_frame_tent')).toBe(false)

    await pending
    expect(getIconSvgDataUrl('pinhead-a_frame_tent')).toMatch(/^data:image\/svg\+xml/)
    expect(isIconSvgConfirmedMissing('pinhead-a_frame_tent')).toBe(false)
  })

  it('loads bundled pinhead SVG when the registry only has a name stub', async () => {
    getIconRegistry().set('pinhead-a_frame_tent', {
      name: 'pinhead-a_frame_tent',
      prefix: 'pinhead',
    })

    await ensureIconsForNames(['pinhead-a_frame_tent'])

    expect(getIconRegistry().get('pinhead-a_frame_tent')?.svgRaw).toContain('<svg')
  })

  it('lists pinhead icons in the catalog after supplier load', async () => {
    await ensureIconSupplier('pinhead')

    const pinheadIcons = [...getIconRegistry().values()].filter(
      (entry) => entry.prefix === 'pinhead',
    )
    expect(pinheadIcons.length).toBeGreaterThan(1000)
    expect(pinheadIcons.some((entry) => entry.name === 'pinhead-a_frame_tent')).toBe(true)
  })
})
