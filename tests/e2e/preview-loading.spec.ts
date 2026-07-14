import { expect, test } from '@playwright/test'

test.describe('preview loading routes', () => {
  test('full-page loading preview', async ({ page }) => {
    await page.goto('/preview-loading')
    await expect(page.getByRole('status')).toContainText('Loading schema…')
    await expect(page.getByText('Preview route for the initial schema load')).toBeVisible()
  })

  test('floating refresh loading preview', async ({ page }) => {
    await page.goto('/preview-loading-refresh')
    await expect(page.getByRole('status')).toContainText('Refreshing schema…')
    await expect(page.getByText('Sample presets list')).toBeVisible()
    await expect(page.getByText('Preview route for background schema activity')).toBeVisible()
  })
})
