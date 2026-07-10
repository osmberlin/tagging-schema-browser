import { describe, expect, it, vi } from 'vitest'
import { ensureIconsForNames, getIconSvgDataUrl } from './iconRegistry'

describe('iconRegistry pinhead icons', () => {
  it('fetches pinhead SVGs from pinhead.ink', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', { status: 200 }),
      )

    await ensureIconsForNames(['pinhead-test_icon'])

    expect(fetchMock).toHaveBeenCalledWith('https://pinhead.ink/latest/test_icon.svg')
    expect(getIconSvgDataUrl('pinhead-test_icon')).toMatch(/^data:image\/svg\+xml/)

    fetchMock.mockRestore()
  })
})
