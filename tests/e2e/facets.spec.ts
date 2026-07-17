import { expect, test } from '@playwright/test'

async function loadTestSchema(page: import('@playwright/test').Page) {
  await page.goto('/?dataUrl=/test-schema')
  await expect(page.getByRole('heading', { name: /^Presets\b/i })).toBeVisible()
  await expect(page.locator('table tbody')).toBeVisible()
}

/** Preset columns are virtualized — filter to one preset when asserting a specific column. */
async function loadTestSchemaPreset(page: import('@playwright/test').Page, query: string) {
  await page.goto(`/?dataUrl=/test-schema&q=${encodeURIComponent(query)}`)
  await expect(page.getByRole('heading', { name: /^Presets\b/i })).toBeVisible()
  await expect(page.locator('table thead th').filter({ hasText: query })).toBeVisible()
}

async function presetColumnHeaderWidths(page: import('@playwright/test').Page) {
  return page
    .locator('table thead tr th:not([aria-hidden])')
    .evaluateAll((ths) => ths.slice(1).map((th) => Math.round(th.getBoundingClientRect().width)))
}

test('preset facets are visible and populated in left navigation', async ({ page }) => {
  await loadTestSchema(page)

  await expect(page.getByRole('heading', { name: 'Filter' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Primary tag' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fields' })).toBeVisible()

  const sidebar = page.locator('aside')
  await expect(sidebar.getByRole('button', { name: /^amenity\b/i })).toBeVisible()
  await expect(sidebar.getByRole('button', { name: /^shop\b/i })).toBeVisible()
  await expect(sidebar.getByRole('button', { name: /^name\b/i })).toBeVisible()
})

test('broken icon presets are flagged and filterable', async ({ page }) => {
  await loadTestSchema(page)

  await expect(page.getByText('Broken icons', { exact: true })).toBeVisible()
  await expect(page.getByText(/missing preset icon/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'show broken preset icons' })).toBeVisible()
  await expect(page.locator('aside').getByRole('button', { name: /^broken\b/i })).toBeVisible()

  await page.getByRole('button', { name: 'show broken preset icons' }).click()
  await expect(page.getByRole('button', { name: 'Has icon: broken' })).toBeVisible()
  await expect(page.getByText('temaki-this-icon-does-not-exist')).toBeVisible()
})

test('missing slash-parent field inheritance is flagged and filterable', async ({ page }) => {
  await loadTestSchema(page)

  await expect(page.getByText('Missing inheritance', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'show unreviewed' })).toBeVisible()
  await expect(
    page.locator('aside').getByRole('button', { name: /Missing \(unreviewed\)/i }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'show unreviewed' }).click()
  await expect(page.getByRole('button', { name: 'Field inheritance: unreviewed' })).toBeVisible()
  await expect(
    page.locator('tbody').getByText('man_made/crane/untyped_crane', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Missing inheritance', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'show unreviewed' })).toHaveCount(0)
})

test('preset detail shows missing inheritance panel', async ({ page }) => {
  await page.goto('/preset/man_made/crane/untyped_crane?dataUrl=/test-schema')

  await page.getByRole('button', { name: 'Missing inheritance' }).click()
  await expect(page.getByTestId('missing-inheritance-panel')).toBeVisible()
  await expect(page.getByText(/Missing parent fields \(unreviewed\)/i)).toBeVisible()
  await expect(page.getByText('crane/type', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'man_made/crane' })).toBeVisible()
  await expect(page.getByTestId('missing-inheritance-create-issue')).toBeVisible()
  await expect(page.getByTestId('missing-inheritance-create-issue')).toHaveAttribute(
    'href',
    /github\.com\/osmberlin\/tagging-schema-browser\/issues\/new/,
  )
})

test('preset detail shows risky typeCombo panel', async ({ page }) => {
  await page.goto('/preset/highway/residential?dataUrl=/test-schema')

  await page.getByRole('button', { name: 'Risky typeCombo' }).click()
  await expect(page.getByTestId('risky-typecombo-panel')).toBeVisible()
  await expect(page.getByText(/Risky typeCombo \(unreviewed\)/i)).toBeVisible()
  await expect(page.getByTestId('risky-typecombo-create-issue')).toBeVisible()
})

test('missing option icons are discoverable on icons page', async ({ page }) => {
  await loadTestSchema(page)
  await page.goto('/icons?dataUrl=/test-schema&i_usage=options&i_hasSvg=missing')

  await expect(page.locator("[data-icon='temaki-missing-option-icon']")).toBeVisible()
  await expect(page.getByText(/1 preset has a missing option icon/i)).toHaveCount(0)
})

test('icons page tracks option icon usage', async ({ page }) => {
  await loadTestSchema(page)
  await page.goto('/icons?dataUrl=/test-schema')

  await expect(page.getByRole('heading', { name: /^Icons\b/i })).toBeVisible()
  await expect(page.getByText('Used by presets or options')).toBeVisible()
  await expect(page.locator("[data-icon='roentgen-bump']")).toBeVisible()
  const bumpCard = page.locator("[data-icon='roentgen-bump']")
  await expect(bumpCard.getByRole('link', { name: /Fields/i })).toBeVisible()
  await bumpCard.getByRole('link', { name: /Fields/i }).click()
  await expect(page).toHaveURL(/\/fields/)
  await expect(page.locator("[data-field='traffic_calming']")).toBeVisible()
})

test('icon mismatch presets are flagged and filterable', async ({ page }) => {
  await loadTestSchema(page)

  await expect(
    page.getByText(/3 presets have icon mismatches between field options and child presets/i),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'show icon mismatches' })).toBeVisible()
  await expect(page.locator('aside').getByRole('button', { name: /^mismatch\b/i })).toBeVisible()

  await page.getByRole('button', { name: 'show icon mismatches' }).click()
  await expect(page.getByRole('button', { name: 'Icon consistency: mismatch' })).toBeVisible()
  await expect(page.locator('tbody').getByText('leisure/playground/slide')).toBeVisible()
})

test('preset detail highlights icon mismatches in field options', async ({ page }) => {
  await loadTestSchema(page)
  await page.goto('/preset/leisure/playground?dataUrl=/test-schema')

  await page.getByRole('button', { name: /"playground\/type"/ }).click()
  await expect(page.getByText('Icon mismatch between field option and child preset')).toHaveCount(2)
  await expect(page.getByTitle('Option icon').filter({ hasText: 'temaki-slide2' })).toBeVisible()
  await expect(page.getByText('preset: roentgen-slide')).toBeVisible()
})

test('child preset detail shows field option mismatch with links', async ({ page }) => {
  await loadTestSchema(page)
  await page.goto('/preset/leisure/playground/cushion?dataUrl=/test-schema')

  const panel = page.getByLabel('Icon mismatch')
  await panel.getByRole('button', { name: 'Icon mismatch' }).click()
  await expect(panel.getByText(/field option icon differs from child preset icon/i)).toBeVisible()
  await expect(panel.getByRole('link', { name: 'Field' })).toBeVisible()
  await expect(panel.getByRole('link', { name: 'Option icon' })).toBeVisible()
  await expect(panel.getByRole('link', { name: 'Preset icon' })).toBeVisible()
  await expect(panel.getByRole('link', { name: 'Parent preset' })).toBeVisible()
  await expect(panel.getByText('temaki-cushion')).toBeVisible()
  await expect(panel.getByText('maki-playground').first()).toBeVisible()
})

test('field detail shows option icon mismatches', async ({ page }) => {
  await loadTestSchema(page)
  await page.goto('/field/playground/type?dataUrl=/test-schema')

  const panel = page.getByLabel('Icon mismatch')
  await panel.getByRole('button', { name: 'Icon mismatch' }).click()
  await expect(panel.getByText('Mismatch').first()).toBeVisible()
  await expect(
    panel.locator('table').getByText('temaki-cushion', { exact: true }).first(),
  ).toBeVisible()
  await expect(
    panel.locator('table').getByText('maki-playground', { exact: true }).first(),
  ).toBeVisible()
})

test('field source JSON links icon values to icons, presets, and fields', async ({ page }) => {
  await page.goto('/field/playground/type?dataUrl=/test-schema')
  await expect(page.getByRole('heading', { name: 'Equipment', exact: true })).toBeVisible()

  const slideIconLink = page.locator('a[href*="i_q=temaki-slide2"]')
  await expect(slideIconLink).toBeVisible()
  await slideIconLink.click()
  await expect(page).toHaveURL(/\/icons\?.*i_q=temaki-slide2/)
})

test('fields page filters icon mismatch fields', async ({ page }) => {
  await loadTestSchema(page)
  await page.goto('/fields?dataUrl=/test-schema')

  await expect(page.getByText(/1 field has icon mismatches/i)).toBeVisible()
  await page.getByRole('button', { name: 'show mismatched fields' }).click()
  await expect(page.locator("[data-field='playground/type']")).toBeVisible()
})

test('icons page usages view lists one row per preset or option reference', async ({ page }) => {
  await loadTestSchema(page)
  await page.goto('/icons?dataUrl=/test-schema&i_view=usages')

  await expect(page.getByRole('group', { name: 'View' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Usages', pressed: true })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Icon' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Label' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Code' })).toBeVisible()
  await expect(page.locator("[data-icon-usage='roentgen-bump']")).toHaveCount(3)
  await expect(
    page.getByRole('link', {
      name: 'Traffic Calming',
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByText('traffic_calming=bump')).toBeVisible()
})

test('preset detail shows field options with child preset links', async ({ page }) => {
  await loadTestSchema(page)
  await page.goto('/preset/man_made/crane?dataUrl=/test-schema')

  await expect(page.getByRole('button', { name: /Source preset/i })).toBeVisible()
  await page.getByRole('button', { name: /"crane\/type"/ }).click()
  await expect(page.getByText('portal_crane', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Portal Crane/i })).toBeVisible()

  await page.getByRole('link', { name: /Portal Crane/i }).click()
  await expect(page).toHaveURL(/\/preset\/man_made\/crane\/portal_crane/)
  await expect(page.getByText('man_made/crane/portal_crane', { exact: true })).toBeVisible()
})

test('field detail page loads without showing not found while schema loads', async ({ page }) => {
  await page.goto('/field/name?dataUrl=/test-schema')
  await expect(page.getByRole('heading', { name: 'Field not found' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /^name$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Source field/i })).toBeVisible()
  await expect(page.getByText('data/fields/name.json')).toBeVisible()
})

test('preset detail page shows source JSON', async ({ page }) => {
  await page.goto('/?dataUrl=/test-schema')
  await page.getByRole('link', { name: /Cafe/i }).first().click()
  await expect(page).toHaveURL(/\/preset\/amenity\/cafe/)
  await expect(page.getByRole('heading', { name: /cafe/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Translation/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Source preset/i })).toBeVisible()
  await expect(page.getByText('data/presets/amenity/cafe.json')).toBeVisible()
  await expect(page.getByText('"name"')).toBeVisible()
})

test('preset template ref unnests fields inside fields array', async ({ page }) => {
  await page.goto('/preset/amenity/doctors/allergology?dataUrl=/test-schema')
  await page.getByRole('button', { name: /"\{amenity\/doctors\}"/ }).click()
  await expect(page.getByText('data/fields/operator.json')).toBeVisible()
  await expect(page.getByText('data/fields/opening_hours.json')).toBeVisible()
  await expect(page.getByText('"fields": [')).toHaveCount(1)
  await expect(page.getByText('"geometry"')).toHaveCount(1)
})

test('preset ref in fields shows inherited fields not parent metadata', async ({ page }) => {
  await page.goto('/preset/amenity/clinic/abortion?dataUrl=/test-schema')
  const fieldsSymlink = page.getByRole('button', { name: /"\{amenity\/clinic\}"/ }).first()
  await fieldsSymlink.click()
  await expect(page.getByText('data/fields/name.json')).toBeVisible()
  await expect(page.getByText('data/fields/operator.json')).toBeVisible()
  await expect(
    page.getByText('omitted: preset tag fixes healthcare:speciality=abortion'),
  ).toBeVisible()
  await expect(page.getByText('"geometry"')).toHaveCount(1)
})

test('dist-expanded slash-parent fields collapse to preset ref in source tree', async ({
  page,
}) => {
  await page.goto('/preset/traffic_sign/variable_message?dataUrl=/test-schema')
  await expect(page.getByRole('button', { name: /"\{traffic_sign\}"/ })).toBeVisible()
  await expect(page.getByText('data/presets/traffic_sign.json')).toBeVisible()
  await expect(page.getByText('data/fields/direction_vertex.json')).toBeVisible()
  await page.getByRole('button', { name: /"\{traffic_sign\}"/ }).click()
  await expect(page.getByText('data/fields/traffic_sign/direction.json')).toBeVisible()
  await expect(
    page.getByText('omitted: preset tag fixes traffic_sign=variable_message'),
  ).toBeVisible()
  await expect(
    page.getByText('omitted: direction_vertex listed explicitly (same tag key)'),
  ).toBeVisible()
})

test('preset ref in moreFields inherits moreFields from parent preset', async ({ page }) => {
  await page.goto('/preset/amenity/clinic/abortion?dataUrl=/test-schema')
  await page
    .getByRole('button', { name: /"\{amenity\/clinic\}"/ })
    .nth(1)
    .click()
  await expect(page.getByText('data/fields/wheelchair.json')).toBeVisible()
  await expect(page.getByText('data/fields/operator.json')).toHaveCount(0)
})

test('unsearchable preset links to underscore-prefixed source file', async ({ page }) => {
  await page.goto('/preset/shop/ice_cream?dataUrl=/test-schema')
  await expect(page.getByText('data/presets/shop/_ice_cream.json')).toBeVisible()
})

test('preset source JSON sorts keys in a stable discoverable order', async ({ page }) => {
  await page.goto('/preset/shop/ice_cream?dataUrl=/test-schema')

  const sourceText = await page.locator('.overflow-x-auto.bg-slate-50.font-mono').innerText()

  const orderedKeys = ['name', 'icon', 'tags', 'geometry', 'fields', 'searchable']
  let lastIndex = -1
  for (const key of orderedKeys) {
    const index = sourceText.indexOf(`"${key}"`)
    expect(index).toBeGreaterThan(lastIndex)
    lastIndex = index
  }
})

test('name preset ref shows inherited labels from referenced preset', async ({ page }) => {
  await page.goto('/preset/shop/ice_cream?dataUrl=/test-schema')
  await page
    .getByRole('button', { name: /"\{amenity\/ice_cream\}"/ })
    .first()
    .click()
  await expect(page.getByText('"Gelateria"')).toBeVisible()
  await expect(page.getByText('"froyo"')).toBeVisible()
  await expect(page.getByText('"gelato"')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ice Cream Shop' })).toBeVisible()
})

test('preset table ID row truncates long values with ellipsis', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 })
  await loadTestSchemaPreset(page, 'amenity/clinic/abortion')

  const idRow = page.locator('tbody tr', { has: page.locator('th', { hasText: /^ID$/ }) })
  const idCell = idRow.locator('td').filter({ hasText: 'amenity/clinic/abortion' }).first()
  await expect(idCell).toBeVisible()

  const truncation = await idCell.locator('span.truncate').evaluate((el) => {
    const style = getComputedStyle(el)
    return {
      textOverflow: style.textOverflow,
      overflow: style.overflow,
      whiteSpace: style.whiteSpace,
      isOverflowing: el.scrollWidth > el.clientWidth,
    }
  })

  expect(truncation.textOverflow).toBe('ellipsis')
  expect(truncation.overflow).toBe('hidden')
  expect(truncation.whiteSpace).toBe('nowrap')
  expect(truncation.isOverflowing).toBe(true)
  await expect(idCell).toHaveAttribute('title', 'amenity/clinic/abortion')
})

test('preset table columns share a fixed width', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await loadTestSchema(page)
  await expect(page.locator('table thead th').nth(1)).toBeVisible()

  const widths = await presetColumnHeaderWidths(page)

  expect(widths.length).toBeGreaterThan(1)
  expect(new Set(widths).size).toBe(1)
  expect(widths[0]).toBe(160)
})

test('preset table column headers expose full name and id via title', async ({ page }) => {
  await loadTestSchemaPreset(page, 'amenity/clinic/abortion')

  const header = page.locator('thead th').filter({ hasText: 'amenity/clinic/abortion' })
  await expect(header.locator('span.font-mono')).toHaveAttribute('title', 'amenity/clinic/abortion')
  await expect(header.locator('span.truncate[title]').first()).toHaveAttribute(
    'title',
    'amenity/clinic/abortion',
  )
  await expect(header.locator('a')).toHaveAttribute('title', /Open preset/i)
})

test('preset table name row wraps instead of truncating', async ({ page }) => {
  await loadTestSchema(page)

  const nameRow = page.locator('tbody tr', { has: page.locator('th', { hasText: /^Name$/ }) })
  const nameCell = nameRow.locator('td').first()
  await expect(nameCell).toBeVisible()

  const style = await nameCell.locator('span.break-words').evaluate((el) => ({
    overflowWrap: getComputedStyle(el).overflowWrap,
    hyphens: getComputedStyle(el).hyphens,
    whiteSpace: getComputedStyle(el).whiteSpace,
  }))

  expect(style.overflowWrap).toBe('break-word')
  expect(style.hyphens).toBe('auto')
  expect(style.whiteSpace).toBe('normal')
})

test('field stringsCrossReference shows dereferenced label on fields page', async ({ page }) => {
  await page.goto('/fields?dataUrl=/test-schema')
  await expect(page.getByRole('heading', { name: /^Fields\b/i })).toBeVisible()
  await expect(page.getByText('Free Menstrual Products Available').first()).toBeVisible()
  await expect(page.getByText('{test/menstrual_products}')).toHaveCount(0)
})

test('field detail resolves stringsCrossReference label and options', async ({ page }) => {
  await page.goto('/field/test/menstrual_products_poi?dataUrl=/test-schema')
  await expect(
    page.getByRole('heading', { name: 'Free Menstrual Products Available' }),
  ).toBeVisible()
  await expect(page.getByText('Yes, in all stalls')).toBeVisible()
  await expect(page.getByText('Limited to some stalls')).toBeVisible()
})

test('field source JSON shows dereferenced values with reference annotation', async ({ page }) => {
  await page.goto('/field/test/menstrual_products_poi?dataUrl=/test-schema')
  await expect(page.getByRole('button', { name: /Source field/i })).toBeVisible()
  const source = page.locator('.overflow-x-auto.bg-slate-50.font-mono')
  await expect(source.getByText('Free Menstrual Products Available').first()).toBeVisible()
  await expect(source.getByText('ref {test/menstrual_products}')).toHaveCount(2)
  await expect(source.getByText('3 option strings')).toBeVisible()
})

test('marker field detail renders structured option translations', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/field/marker?reference=release')
  await expect(page.getByRole('heading', { name: /^Type$/i })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('aerial / title')).toBeVisible()
  await expect(page.getByText('Designed to be visible from the air.')).toBeVisible()
  expect(errors).toEqual([])
})

test('field detail does not flash "Field not found" while schema loads', async ({ page }) => {
  await page.goto('/field/name?dataUrl=/test-schema')
  await expect(page.getByText('Field not found')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /^Name$/i })).toBeVisible({ timeout: 10_000 })
})

test('preset table icon row truncates long icon names', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await loadTestSchema(page)

  const iconRow = page.locator('tbody tr', { has: page.locator('th', { hasText: /^Icon$/ }) })
  const iconCell = iconRow
    .locator('td')
    .filter({ hasText: 'temaki-this-icon-does-not-exist' })
    .first()
  await expect(iconCell).toBeVisible()

  const truncation = await iconCell.locator('span.truncate').evaluate((el) => ({
    textOverflow: getComputedStyle(el).textOverflow,
    isOverflowing: el.scrollWidth > el.clientWidth,
  }))

  expect(truncation.textOverflow).toBe('ellipsis')
  expect(truncation.isOverflowing).toBe(true)
})

test('preset table icon row shows full SVG after async supplier load', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('/?dataUrl=/test-schema&iconName=["maki-doctor"]')
  await expect(page.getByRole('heading', { name: /^Presets\b/i })).toBeVisible()

  const iconRow = page.locator('tbody tr', { has: page.locator('th', { hasText: /^Icon$/ }) })
  const iconImg = iconRow.locator('img').first()
  await expect(iconImg).toBeVisible({ timeout: 15_000 })
  await expect(iconImg).toHaveClass(/object-contain/)

  const clipInfo = await iconImg.evaluate((el) => {
    const imgRect = el.getBoundingClientRect()
    let node = el.parentElement
    while (node) {
      const style = getComputedStyle(node)
      if (style.overflow !== 'visible' || style.overflowX !== 'visible') {
        const rect = node.getBoundingClientRect()
        if (imgRect.right > rect.right + 1 || imgRect.left < rect.left - 1) {
          return { clipped: true, parent: node.className }
        }
      }
      node = node.parentElement
    }
    return { clipped: false }
  })
  expect(clipInfo.clipped).toBe(false)

  const layout = await iconRow
    .locator('td')
    .first()
    .evaluate((td) => {
      const img = td.querySelector('img')
      const tdRect = td.getBoundingClientRect()
      const imgRect = img?.getBoundingClientRect()
      return {
        tdHeight: tdRect.height,
        imgHeight: imgRect?.height ?? 0,
        imgFullyVisible: imgRect ? imgRect.height >= 18 && imgRect.top >= tdRect.top : false,
      }
    })
  expect(layout.tdHeight).toBeGreaterThanOrEqual(28)
  expect(layout.imgFullyVisible).toBe(true)
})

test('preset table linked icon cells truncate icon names cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('/?dataUrl=/test-schema&iconName=temaki-food')
  await expect(page.getByRole('heading', { name: /^Presets\b/i })).toBeVisible()
  await expect(page.locator('table tbody')).toBeVisible()

  const iconRow = page.locator('tbody tr', { has: page.locator('th', { hasText: /^Icon$/ }) })
  const iconCell = iconRow.locator('td a').filter({ hasText: 'temaki-food' }).first()
  await expect(iconCell).toBeVisible()

  const layout = await iconCell.locator('span.truncate.font-mono').evaluate((el) => ({
    textOverflow: getComputedStyle(el).textOverflow,
    flex: getComputedStyle(el).flex,
    overflow: getComputedStyle(el).overflow,
    parentOverflow: getComputedStyle(el.parentElement!).overflow,
  }))

  expect(layout.textOverflow).toBe('ellipsis')
  expect(layout.flex).toContain('1')
  expect(layout.overflow).toBe('hidden')
  expect(layout.parentOverflow).toBe('visible')
})

test('template presets are hidden by default and filterable', async ({ page }) => {
  await loadTestSchema(page)

  await expect(page.locator('table thead th').filter({ hasText: '@templates/poi' })).toHaveCount(0)

  const templateFacet = page.locator('aside').getByRole('heading', { name: 'Template' })
  await expect(templateFacet).toBeVisible()
  await templateFacet
    .locator('..')
    .getByRole('button', { name: /^Yes\b/i })
    .click()
  await expect(page.locator('table thead th').filter({ hasText: '@templates/poi' })).toBeVisible()
})

test('searchable facet filters presets with searchable false', async ({ page }) => {
  await loadTestSchema(page)

  const searchableFacet = page.locator('aside').getByRole('heading', { name: 'Searchable' })
  await expect(searchableFacet).toBeVisible()
  await searchableFacet.locator('..').getByRole('button', { name: /^No\b/i }).click()

  await expect(page.locator('table thead th').filter({ hasText: 'shop/ice_cream' })).toBeVisible()
  await expect(page.locator('table thead th').filter({ hasText: 'amenity/cafe' })).toHaveCount(0)
})

test('unsearchable presets are highlighted in the searchable row', async ({ page }) => {
  await loadTestSchemaPreset(page, 'shop/ice_cream')

  const searchableRow = page.locator('tbody tr', {
    has: page.locator('th', { hasText: /^Searchable$/ }),
  })
  await expect(searchableRow.locator('td').filter({ hasText: /^no$/ })).toBeVisible()
  await expect(page.getByText('unsearchable', { exact: true })).toHaveCount(0)
})
