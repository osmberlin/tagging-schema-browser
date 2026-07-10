import { expect, test } from '@playwright/test'

test('unreleased is the default reference', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByRole('tablist', { name: 'Schema reference' })
  await expect(toggle).toBeVisible()
  await expect(page.getByRole('tab', { name: /^Unreleased/i })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page).not.toHaveURL(/reference=/)
})

test('reference toggle is visible on narrow viewports', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('tablist', { name: 'Schema reference' })).toBeVisible()
  await expect(page.getByRole('tab', { name: /^Unreleased/i })).toBeVisible()
})

test('reference toggle switches to release in URL', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.getByRole('tab', { name: /^Release/i }).click()
  await expect(page).toHaveURL(/reference=release/, { timeout: 30_000 })
  await expect(page.getByRole('tab', { name: /^Release/i })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('reference toggle switches back to unreleased without snapping to release', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/?reference=release')
  await expect(page.getByRole('tab', { name: /^Release/i })).toHaveAttribute(
    'aria-selected',
    'true',
    { timeout: 30_000 },
  )

  await page.getByRole('tab', { name: /^Unreleased/i }).click()
  await expect(page).not.toHaveURL(/reference=release/, { timeout: 30_000 })
  await expect(page.getByRole('tab', { name: /^Unreleased/i })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('reference toggle is hidden while a custom dataUrl is active', async ({ page }) => {
  await page.goto('/?dataUrl=/test-schema')
  await expect(page.getByRole('tablist', { name: 'Schema reference' })).toHaveCount(0)
})

test('custom dataUrl shows comparison nav and banner', async ({ page }) => {
  await page.goto('/?dataUrl=/test-schema')
  await expect(page.getByRole('link', { name: /Comparison/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Show unreleased/i })).toBeVisible()
})
