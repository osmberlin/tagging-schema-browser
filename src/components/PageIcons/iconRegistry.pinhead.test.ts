import { describe, expect, it, vi } from 'vitest'
import { getIconSvgDataUrl, isIconSvgConfirmedMissing } from '@/components/PageIcons/iconRegistry'

describe('isIconSvgConfirmedMissing pinhead icons', () => {
  it('does not mark pinhead icons broken before fetch completes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve(
                new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', { status: 200 }),
              ),
            20,
          )
        }),
    )

    const { ensureIconsForNames } = await import('@/components/PageIcons/iconRegistry')
    const pending = ensureIconsForNames(['pinhead-delayed_icon'])

    expect(isIconSvgConfirmedMissing('pinhead-delayed_icon')).toBe(false)

    await pending
    expect(getIconSvgDataUrl('pinhead-delayed_icon')).toMatch(/^data:image\/svg\+xml/)
    expect(isIconSvgConfirmedMissing('pinhead-delayed_icon')).toBe(false)

    fetchMock.mockRestore()
  })
})
