import { expect, test } from '@playwright/test'
import {
  COLD_LOAD_BUDGET_MS,
  RELEASE_NAV_BUDGET_MS,
  WARM_NAV_BUDGET_MS,
  expectWithinBudget,
  loadTestSchemaPresets,
  measureNavigationMs,
} from './helpers/navigationTiming'

test.describe('navigation performance', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { __navLongTasks?: number[] }).__navLongTasks = []
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            ;(window as unknown as { __navLongTasks: number[] }).__navLongTasks.push(entry.duration)
          }
        }).observe({ entryTypes: ['longtask'] })
      } catch {
        // Long-task API not available in all browsers.
      }
    })
  })

  test('cold load test schema on Presets', async ({ page }) => {
    const start = Date.now()
    await page.goto('/?dataUrl=/test-schema')
    await expect(page.getByRole('heading', { name: /^Presets\b/i })).toBeVisible({
      timeout: COLD_LOAD_BUDGET_MS,
    })
    await expect(page.locator('table tbody')).toBeVisible()
    const elapsed = Date.now() - start
    expectWithinBudget('cold Presets load', elapsed, COLD_LOAD_BUDGET_MS)
    console.log(`cold Presets load: ${elapsed}ms`)
  })

  test('main nav hops stay snappy with warm schema cache', async ({ page }) => {
    await loadTestSchemaPresets(page)

    const hops = [
      { link: 'Icons', heading: /^Icons\b/i },
      { link: 'Fields', heading: /^Fields\b/i },
      { link: 'Translations', heading: /^Translations\b/i },
      { link: 'Presets', heading: /^Presets\b/i },
    ] as const

    const mainNav = page.getByRole('navigation', { name: 'Main' })

    for (const hop of hops) {
      const elapsed = await measureNavigationMs(
        page,
        () => mainNav.getByRole('link', { name: hop.link, exact: true }).click(),
        page.getByRole('heading', { name: hop.heading }),
        WARM_NAV_BUDGET_MS,
      )
      expectWithinBudget(`Main → ${hop.link}`, elapsed, WARM_NAV_BUDGET_MS)
      console.log(`Main → ${hop.link}: ${elapsed}ms`)
    }
  })

  test('Presets → Fields does not stall (issue #109 sidebar scan)', async ({ page }) => {
    await loadTestSchemaPresets(page)

    const elapsed = await measureNavigationMs(
      page,
      () =>
        page
          .getByRole('navigation', { name: 'Main' })
          .getByRole('link', { name: 'Fields', exact: true })
          .click(),
      page.getByRole('heading', { name: /^Fields\b/i }),
      WARM_NAV_BUDGET_MS,
    )
    expectWithinBudget('Presets → Fields', elapsed, WARM_NAV_BUDGET_MS)
    await expect(page.locator("[data-field='playground/type']")).toBeVisible()
    console.log(`Presets → Fields: ${elapsed}ms`)
  })

  test('Fields → field detail → related preset', async ({ page }) => {
    await loadTestSchemaPresets(page)
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Fields', exact: true })
      .click()
    await expect(page.getByRole('heading', { name: /^Fields\b/i })).toBeVisible()

    const toField = await measureNavigationMs(
      page,
      () => page.locator("[data-field='playground/type']").click(),
      page.getByRole('heading', { name: /^Equipment$/i }),
      WARM_NAV_BUDGET_MS,
    )
    expectWithinBudget('Fields → field detail', toField, WARM_NAV_BUDGET_MS)
    console.log(`Fields → field detail: ${toField}ms`)

    const toPreset = await measureNavigationMs(
      page,
      () => page.getByRole('link', { name: /^Playground$/ }).click(),
      page.getByText('leisure/playground', { exact: true }),
      WARM_NAV_BUDGET_MS,
    )
    expectWithinBudget('field detail → preset', toPreset, WARM_NAV_BUDGET_MS)
    console.log(`field detail → preset: ${toPreset}ms`)

    const toChild = await measureNavigationMs(
      page,
      async () => {
        await page.getByRole('button', { name: /"playground\/type"/ }).click()
        await page.getByRole('link', { name: /Playground Slide/i }).click()
      },
      page.getByText('leisure/playground/slide', { exact: true }),
      WARM_NAV_BUDGET_MS,
    )
    expectWithinBudget('preset → child via field option', toChild, WARM_NAV_BUDGET_MS)
    console.log(`preset → child via field option: ${toChild}ms`)
  })

  test('Presets → preset detail → field option child preset', async ({ page }) => {
    await loadTestSchemaPresets(page)

    const toPreset = await measureNavigationMs(
      page,
      () => page.getByRole('link', { name: /Cafe/i }).first().click(),
      page.getByRole('heading', { name: /cafe/i }),
      WARM_NAV_BUDGET_MS,
    )
    expectWithinBudget('Presets → preset detail', toPreset, WARM_NAV_BUDGET_MS)

    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Fields', exact: true })
      .click()
    await expect(page.getByRole('heading', { name: /^Fields\b/i })).toBeVisible()

    const backToPresets = await measureNavigationMs(
      page,
      () =>
        page
          .getByRole('navigation', { name: 'Main' })
          .getByRole('link', { name: 'Presets', exact: true })
          .click(),
      page.getByRole('heading', { name: /^Presets\b/i }),
      WARM_NAV_BUDGET_MS,
    )
    expectWithinBudget('Fields → Presets return', backToPresets, WARM_NAV_BUDGET_MS)
    console.log(`Fields → Presets return: ${backToPresets}ms`)

    await page.goto('/preset/man_made/crane?dataUrl=/test-schema')
    await expect(page.getByRole('button', { name: /Source preset/i })).toBeVisible()

    const toChild = await measureNavigationMs(
      page,
      async () => {
        await page.getByRole('button', { name: /"crane\/type"/ }).click()
        await page.getByRole('link', { name: /Portal Crane/i }).click()
      },
      page.getByText('man_made/crane/portal_crane', { exact: true }),
      WARM_NAV_BUDGET_MS,
    )
    expectWithinBudget('preset → child preset via field option', toChild, WARM_NAV_BUDGET_MS)
    console.log(`preset → child preset: ${toChild}ms`)
  })

  test('Icons sub-view navigation stays snappy', async ({ page }) => {
    await loadTestSchemaPresets(page)

    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Icons', exact: true })
      .click()
    await expect(page.getByRole('heading', { name: /^Icons\b/i })).toBeVisible()

    const toUsages = await measureNavigationMs(
      page,
      () => page.goto('/icons?dataUrl=/test-schema&i_view=usages'),
      page.getByRole('button', { name: 'Usages', pressed: true }),
      WARM_NAV_BUDGET_MS,
    )
    expectWithinBudget('Icons usages view', toUsages, WARM_NAV_BUDGET_MS)
    console.log(`Icons usages view: ${toUsages}ms`)
  })
})

test.describe('release schema navigation (optional)', () => {
  test.skip(
    !process.env.NAV_PERF_RELEASE,
    'Set NAV_PERF_RELEASE=1 to run release-schema timing (network)',
  )

  test.describe.configure({ mode: 'serial' })

  test('release: field highway → highway preset (issue #109)', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/?reference=release')
    await expect(page.getByRole('heading', { name: /^Presets\b/i })).toBeVisible({
      timeout: 60_000,
    })

    await page.goto('/field/highway?reference=release')
    await expect(page.getByRole('heading', { name: /^Type$/i })).toBeVisible({
      timeout: RELEASE_NAV_BUDGET_MS * 3,
    })

    const toPreset = await measureNavigationMs(
      page,
      () =>
        page
          .getByRole('link', { name: /Highway Feature|^highway$/i })
          .first()
          .click(),
      page.getByText('highway', { exact: true }),
      RELEASE_NAV_BUDGET_MS,
    )
    expectWithinBudget('release field → highway', toPreset, RELEASE_NAV_BUDGET_MS)
    console.log(`release field → highway: ${toPreset}ms`)

    const hops = [
      { link: 'Fields', heading: /^Fields\b/i },
      { link: 'Presets', heading: /^Presets\b/i },
      { link: 'Icons', heading: /^Icons\b/i },
    ] as const
    const mainNav = page.getByRole('navigation', { name: 'Main' })

    for (const hop of hops) {
      const elapsed = await measureNavigationMs(
        page,
        () => mainNav.getByRole('link', { name: hop.link, exact: true }).click(),
        page.getByRole('heading', { name: hop.heading }),
        RELEASE_NAV_BUDGET_MS,
      )
      expectWithinBudget(`release Main → ${hop.link}`, elapsed, RELEASE_NAV_BUDGET_MS)
      console.log(`release Main → ${hop.link}: ${elapsed}ms`)
    }
  })
})
