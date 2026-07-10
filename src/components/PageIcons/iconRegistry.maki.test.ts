import { describe, expect, it } from 'vitest'
import { ensureIconsForNames, getIconSvgDataUrl } from './iconRegistry'

describe('iconRegistry maki icons', () => {
  it('resolves maki-doctor after async supplier load', async () => {
    await ensureIconsForNames(['maki-doctor'])
    expect(getIconSvgDataUrl('maki-doctor')).toMatch(/^data:image\/svg\+xml/)
  })
})
