import { expect, test } from '@playwright/test'

function schemaVersionButton(page: import('@playwright/test').Page) {
  return page.getByRole('button', { name: 'Schema version' })
}

/** Open the schema version menu and choose an item (DOM click: CDN load shifts layout). */
async function chooseMenuItem(page: import('@playwright/test').Page, label: string) {
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[aria-label="Schema version"]')?.click()
  })
  await expect(page.getByRole('menu')).toBeVisible()
  await page.evaluate((itemLabel) => {
    const item = [...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find((el) =>
      el.textContent?.includes(itemLabel),
    )
    if (!item) throw new Error(`Menu item not found: ${itemLabel}`)
    item.click()
  }, label)
}

/** Choose a "Browse without compare" item while the comparing menu is open. */
async function chooseBrowseWithoutCompare(
  page: import('@playwright/test').Page,
  target: 'unreleased' | 'release',
) {
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[aria-label="Schema version"]')?.click()
  })
  await expect(page.getByRole('menu')).toBeVisible()
  await page.evaluate((browseTarget) => {
    const menu = document.querySelector('[role="menu"]')
    if (!menu) throw new Error('Schema version menu not found')
    const labels = [...menu.querySelectorAll<HTMLDivElement>('div.uppercase')]
    const browseLabel = labels.find((el) => el.textContent === 'Browse without compare')
    if (!browseLabel) throw new Error('Browse without compare section not found')
    const items = [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
    const startIndex = items.findIndex(
      (item) => browseLabel.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING,
    )
    const browseItems = startIndex === -1 ? [] : items.slice(startIndex)
    const item = browseItems.find((el) => {
      const text = el.textContent ?? ''
      return browseTarget === 'unreleased'
        ? text.startsWith('Unreleased')
        : text.startsWith('Release') && !text.includes(' vs ')
    })
    if (!item) throw new Error(`Browse menu item not found: ${browseTarget}`)
    item.click()
  }, target)
}

test('unreleased is the default reference', async ({ page }) => {
  await page.goto('/')
  const trigger = schemaVersionButton(page)
  await expect(trigger).toBeVisible()
  await expect(trigger).toContainText(/Unreleased/i)
  await expect(page).not.toHaveURL(/reference=/)
})

test('schema version dropdown is visible on narrow viewports', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(schemaVersionButton(page)).toBeVisible()
  await expect(schemaVersionButton(page)).toContainText(/Unreleased/i)
})

test('schema version dropdown switches to release in URL', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await chooseMenuItem(page, 'Release')
  await expect(page).toHaveURL(/reference=release/, { timeout: 30_000 })
  await expect(schemaVersionButton(page)).toContainText(/Release/i, { timeout: 30_000 })
})

test('schema version dropdown switches back to unreleased without snapping to release', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/?reference=release')
  await expect(schemaVersionButton(page)).toContainText(/Release/i, { timeout: 30_000 })

  await chooseMenuItem(page, 'Unreleased')
  await expect(page).not.toHaveURL(/reference=release/, { timeout: 30_000 })
  // Schema reload remounts the header briefly; the race bug would restore reference=release.
  await expect.poll(() => page.url(), { timeout: 5_000 }).not.toMatch(/reference=release/)
  await expect(schemaVersionButton(page)).toContainText(/Unreleased/i, { timeout: 60_000 })
})

test('schema version dropdown stays visible while a custom dataUrl is active', async ({ page }) => {
  await page.goto('/?dataUrl=/test-schema')
  await expect(schemaVersionButton(page)).toBeVisible()
})

test('custom dataUrl shows comparison nav and banner', async ({ page }) => {
  await page.goto('/?dataUrl=/test-schema')
  await expect(page.getByRole('link', { name: /Comparison/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Show unreleased/i })).toBeVisible()
})

test('comparison banner exits preview when showing unreleased', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/?dataUrl=/test-schema')
  await expect(page.getByRole('button', { name: /Show unreleased/i })).toBeVisible()

  await page.getByRole('button', { name: /Show unreleased/i }).click({ force: true })
  await expect(page).not.toHaveURL(/dataUrl=/)
  await expect(page).not.toHaveURL(/reference=release/)
})

test('comparison banner exits preview when showing release', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/?dataUrl=/test-schema')
  await page.getByRole('button', { name: /Show release/i }).click({ force: true })
  await expect(page).not.toHaveURL(/dataUrl=/)
  await expect(page).toHaveURL(/reference=release/, { timeout: 30_000 })
})

test('schema version dropdown preserves dataUrl when switching compare mode', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/?dataUrl=/test-schema')
  await chooseMenuItem(page, 'vs release')
  await expect(page).toHaveURL(/dataUrl=/)
  await expect(page).toHaveURL(/reference=release/, { timeout: 30_000 })
})

test('schema version dropdown exits compare when browsing release', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/?dataUrl=/test-schema')
  await chooseBrowseWithoutCompare(page, 'release')
  await expect(page).not.toHaveURL(/dataUrl=/)
  await expect(page).toHaveURL(/reference=release/, { timeout: 30_000 })
})

test('schema version dropdown opens PR preview from input', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[aria-label="Schema version"]')?.click()
  })
  await expect(page.getByRole('menu')).toBeVisible()
  await page.getByPlaceholder('2477').fill('2477')
  await page.locator('#reference-dropdown-pr-input').press('Enter')
  await expect(page).toHaveURL(/dataUrl=.*pr-2477/, { timeout: 30_000 })
  await expect(page).not.toHaveURL(/reference=release/)
})
