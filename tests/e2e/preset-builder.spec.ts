import { expect, test } from '@playwright/test'

test('preset builder reads tags from URL and shows derived id', async ({ page }) => {
  const tags = encodeURIComponent(JSON.stringify({ amenity: 'cafe' }))
  await page.goto(`/preset-builder?dataUrl=/test-schema&pb_tags=${tags}`)
  await expect(page.getByRole('heading', { name: 'Preset builder' })).toBeVisible()
  await expect(page.locator('dl').getByText('amenity/cafe', { exact: true })).toBeVisible()
  await expect(page.getByText('data/presets/amenity/cafe.json').first()).toBeVisible()
})

test('preset builder stores tag edits in URL', async ({ page }) => {
  await page.goto('/preset-builder?dataUrl=/test-schema')
  const identity = page.locator('section').filter({ hasText: 'Identity' })
  await identity.getByPlaceholder('amenity').fill('amenity')
  await identity.getByPlaceholder('cafe', { exact: true }).fill('cafe')
  await expect(page.locator('dl').getByText('amenity/cafe', { exact: true })).toBeVisible({
    timeout: 10_000,
  })
  expect(page.url()).toMatch(/pb_tags=.*cafe/)
})

test('preset builder nav link is available', async ({ page }) => {
  await page.goto('/?dataUrl=/test-schema')
  await page.getByRole('link', { name: 'Preset builder' }).click()
  await expect(page).toHaveURL(/\/preset-builder/)
  await expect(page.getByRole('heading', { name: 'Preset builder' })).toBeVisible()
})
