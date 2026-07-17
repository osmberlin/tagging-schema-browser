import { expect, test } from '@playwright/test'

function schemaVersionButton(page: import('@playwright/test').Page) {
  return page.getByRole('button', { name: 'Schema version' })
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

test('schema version dropdown lists unreleased and release options', async ({ page }) => {
  await page.goto('/')
  await schemaVersionButton(page).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: /^Unreleased/i })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: /^Release/i })).toBeVisible()
})

test('schema version dropdown reflects release URL state', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/?reference=release')
  await expect(schemaVersionButton(page)).toContainText(/Release/i, { timeout: 30_000 })
  await schemaVersionButton(page).click()
  await expect(page.getByRole('menuitem', { name: /^Release/i })).toHaveClass(/bg-slate-900/)
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

test('comparison banner preserves dataUrl when switching to unreleased baseline', async ({
  page,
}) => {
  await page.goto('/?dataUrl=/test-schema&reference=release')
  await expect(page.getByRole('button', { name: /Show unreleased/i })).toBeVisible()

  await page.getByRole('button', { name: /Show unreleased/i }).click()
  await expect(page).toHaveURL(/dataUrl=/)
  await expect(page).not.toHaveURL(/reference=release/)
})

test('schema version dropdown opens PR preview from input', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await schemaVersionButton(page).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await page.getByPlaceholder('2477').fill('2477')
  await page.locator('#reference-dropdown-pr-input').press('Enter')
  await expect(page).toHaveURL(/dataUrl=.*pr-2477/, { timeout: 30_000 })
  await expect(page).not.toHaveURL(/reference=release/)
})
