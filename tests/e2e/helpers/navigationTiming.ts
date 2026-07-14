import { expect, type Locator, type Page } from '@playwright/test'

/** Max ms until `ready` is visible after `action` (client nav, schema already warm). */
export const WARM_NAV_BUDGET_MS = Number(process.env.NAV_PERF_WARM_MS ?? 2_500)

/** Max ms for the first schema load on Presets (test fixture). */
export const COLD_LOAD_BUDGET_MS = Number(process.env.NAV_PERF_COLD_MS ?? 8_000)

/** Optional release-schema hops — slower network + larger payload. */
export const RELEASE_NAV_BUDGET_MS = Number(process.env.NAV_PERF_RELEASE_MS ?? 5_000)

export async function loadTestSchemaPresets(page: Page) {
  await page.goto('/?dataUrl=/test-schema')
  await expect(page.getByRole('heading', { name: /^Presets\b/i })).toBeVisible({
    timeout: COLD_LOAD_BUDGET_MS,
  })
  await expect(page.locator('table tbody')).toBeVisible()
}

export async function measureNavigationMs(
  page: Page,
  action: () => Promise<void>,
  ready: Locator,
  budgetMs: number,
): Promise<number> {
  await page.evaluate(() => {
    ;(window as unknown as { __navLongTasks?: number[] }).__navLongTasks = []
  })

  const start = Date.now()
  await action()
  await expect(ready).toBeVisible({ timeout: budgetMs })
  const elapsed = Date.now() - start

  const longTasks = await page.evaluate(() => {
    const tasks = (window as unknown as { __navLongTasks?: number[] }).__navLongTasks ?? []
    return tasks.filter((d) => d >= 50)
  })
  if (longTasks.length > 0) {
    const max = Math.max(...longTasks)
    console.log(`  long tasks (≥50ms): ${longTasks.length}, max ${max.toFixed(0)}ms`)
  }

  return elapsed
}

export function expectWithinBudget(label: string, elapsedMs: number, budgetMs: number) {
  expect(elapsedMs, `${label} took ${elapsedMs}ms (budget ${budgetMs}ms)`).toBeLessThan(budgetMs)
}
