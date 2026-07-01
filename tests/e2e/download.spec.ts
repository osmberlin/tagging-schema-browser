import { expect, test } from '@playwright/test'

async function loadTestSchema(page: import('@playwright/test').Page) {
  await page.goto('/?dataUrl=/test-schema')
  await expect(page.getByRole('heading', { name: /^Presets\b/i })).toBeVisible()
}

test('overview pages offer filtered JSON download', async ({ page }) => {
  await loadTestSchema(page)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('presets.json')

  await page.goto('/icons?dataUrl=/test-schema')
  await expect(page.getByRole('heading', { name: /^Icons\b/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download JSON' })).toBeVisible()

  await page.goto('/fields?dataUrl=/test-schema')
  await expect(page.getByRole('heading', { name: /^Fields\b/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download JSON' })).toBeVisible()

  await page.goto('/translations?dataUrl=/test-schema')
  await expect(page.getByRole('heading', { name: /^Translations\b/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download JSON' })).toBeVisible()
})

test('preset download reflects active filters', async ({ page }) => {
  await page.goto('/?dataUrl=/test-schema&geometry=["vertex"]')
  await expect(page.getByRole('heading', { name: /^Presets\b/i })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON' }).click()
  const download = await downloadPromise
  const path = await download.path()
  expect(path).toBeTruthy()
  const content = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of content) {
    chunks.push(Buffer.from(chunk))
  }
  const json = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Array<{ id: string }>
  expect(json.length).toBeGreaterThan(0)
  expect(json.every((entry) => typeof entry.id === 'string')).toBe(true)
})
