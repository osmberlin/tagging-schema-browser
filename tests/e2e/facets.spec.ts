import { expect, test } from "@playwright/test";

async function loadTestSchema(page: import("@playwright/test").Page) {
  await page.goto("/?dataUrl=/test-schema");
  await expect(page.getByRole("heading", { name: /^Presets\b/i })).toBeVisible();
}

test("preset facets are visible and populated in left navigation", async ({ page }) => {
  await loadTestSchema(page);

  await expect(page.getByText("Faceted Search")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Primary tag" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fields" })).toBeVisible();

  const sidebar = page.locator("aside");
  await expect(sidebar.getByRole("button", { name: /^amenity\b/i })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: /^shop\b/i })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: /^name\b/i })).toBeVisible();
});

test("broken icon presets are flagged and filterable", async ({ page }) => {
  await loadTestSchema(page);

  await expect(page.getByText(/1 preset references a missing preset icon/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "show broken preset icons" })).toBeVisible();
  await expect(page.locator("aside").getByRole("button", { name: /^broken\b/i })).toBeVisible();

  await page.getByRole("button", { name: "show broken preset icons" }).click();
  await expect(page.getByRole("button", { name: "Has icon: broken" })).toBeVisible();
  await expect(page.getByText("temaki-this-icon-does-not-exist")).toBeVisible();
});

test("missing option icons are discoverable on icons page", async ({ page }) => {
  await loadTestSchema(page);
  await page.goto("/icons?dataUrl=/test-schema&i_usage=options&i_hasSvg=missing");

  await expect(page.locator("[data-icon='temaki-missing-option-icon']")).toBeVisible();
  await expect(page.getByText(/1 preset has a missing option icon/i)).toHaveCount(0);
});

test("icons page tracks option icon usage", async ({ page }) => {
  await loadTestSchema(page);
  await page.goto("/icons?dataUrl=/test-schema");

  await expect(page.getByRole("heading", { name: /^Icons\b/i })).toBeVisible();
  await expect(page.getByText("Used by presets or options")).toBeVisible();
  await expect(page.locator("[data-icon='roentgen-bump']")).toBeVisible();
  await expect(page.locator("[data-icon='roentgen-bump']").getByText("Options")).toBeVisible();
});

test("preset detail shows field options with child preset links", async ({ page }) => {
  await loadTestSchema(page);
  await page.goto("/preset/man_made/crane?dataUrl=/test-schema");

  await expect(page.getByRole("button", { name: /Source preset/i })).toBeVisible();
  await page.getByRole("button", { name: /"crane\/type"/ }).click();
  await expect(page.getByText("portal_crane")).toBeVisible();
  await expect(page.getByRole("button", { name: /Portal Crane/i })).toBeVisible();

  await page.getByRole("button", { name: /Portal Crane/i }).click();
  await expect(page).toHaveURL(/\/preset\/man_made\/crane\/portal_crane/);
  await expect(page.getByText("man_made/crane/portal_crane")).toBeVisible();
});

test("preset detail page shows source JSON", async ({ page }) => {
  await page.goto("/?dataUrl=/test-schema");
  await page.getByRole("button", { name: /cafe/i }).first().click();
  await expect(page).toHaveURL(/\/preset\/amenity\/cafe/);
  await expect(page.getByRole("heading", { name: /cafe/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Translation/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Source preset/i })).toBeVisible();
  await expect(page.getByText("data/presets/amenity/cafe.json")).toBeVisible();
  await expect(page.getByText('"name"')).toBeVisible();
});

test("preset template ref unnests fields inside fields array", async ({ page }) => {
  await page.goto("/preset/amenity/doctors/allergology?dataUrl=/test-schema");
  await page.getByRole("button", { name: /"\{amenity\/doctors\}"/ }).click();
  await expect(page.getByText("data/fields/operator.json")).toBeVisible();
  await expect(page.getByText("data/fields/opening_hours.json")).toBeVisible();
  await expect(page.getByText('"fields": [')).toHaveCount(1);
  await expect(page.getByText('"geometry"')).toHaveCount(1);
});

test("preset ref in fields shows inherited fields not parent metadata", async ({ page }) => {
  await page.goto("/preset/amenity/clinic/abortion?dataUrl=/test-schema");
  const fieldsSymlink = page.getByRole("button", { name: /"\{amenity\/clinic\}"/ }).first();
  await fieldsSymlink.click();
  await expect(page.getByText("data/fields/name.json")).toBeVisible();
  await expect(page.getByText("data/fields/operator.json")).toBeVisible();
  await expect(page.getByText("data/fields/healthcare/speciality.json")).toHaveCount(0);
  await expect(page.getByText('"geometry"')).toHaveCount(1);
});

test("preset ref in moreFields inherits moreFields from parent preset", async ({ page }) => {
  await page.goto("/preset/amenity/clinic/abortion?dataUrl=/test-schema");
  await page
    .getByRole("button", { name: /"\{amenity\/clinic\}"/ })
    .nth(1)
    .click();
  await expect(page.getByText("data/fields/wheelchair.json")).toBeVisible();
  await expect(page.getByText("data/fields/operator.json")).toHaveCount(0);
});

test("unsearchable preset links to underscore-prefixed source file", async ({ page }) => {
  await page.goto("/preset/shop/ice_cream?dataUrl=/test-schema");
  await expect(page.getByText("data/presets/shop/_ice_cream.json")).toBeVisible();
});

test("preset source JSON sorts keys in a stable discoverable order", async ({ page }) => {
  await page.goto("/preset/shop/ice_cream?dataUrl=/test-schema");

  const sourceText = await page.locator(".overflow-x-auto.bg-slate-50.font-mono").innerText();

  const orderedKeys = ["name", "icon", "tags", "geometry", "fields", "searchable"];
  let lastIndex = -1;
  for (const key of orderedKeys) {
    const index = sourceText.indexOf(`"${key}"`);
    expect(index).toBeGreaterThan(lastIndex);
    lastIndex = index;
  }
});

test("name preset ref shows inherited labels from referenced preset", async ({ page }) => {
  await page.goto("/preset/shop/ice_cream?dataUrl=/test-schema");
  await page
    .getByRole("button", { name: /"\{amenity\/ice_cream\}"/ })
    .first()
    .click();
  await expect(page.getByText('"Gelateria"')).toBeVisible();
  await expect(page.getByText('"froyo"')).toBeVisible();
  await expect(page.getByText('"gelato"')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ice Cream Shop" })).toBeVisible();
});

test("preset table ID row truncates long values with ellipsis", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("/?dataUrl=/test-schema");

  const idRow = page.locator("tbody tr", { has: page.locator("th", { hasText: /^ID$/ }) });
  const idCell = idRow.locator("td").filter({ hasText: "amenity/clinic/abortion" }).first();
  await expect(idCell).toBeVisible();

  const truncation = await idCell.locator("span.truncate").evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      textOverflow: style.textOverflow,
      overflow: style.overflow,
      whiteSpace: style.whiteSpace,
      isOverflowing: el.scrollWidth > el.clientWidth,
    };
  });

  expect(truncation.textOverflow).toBe("ellipsis");
  expect(truncation.overflow).toBe("hidden");
  expect(truncation.whiteSpace).toBe("nowrap");
  expect(truncation.isOverflowing).toBe(true);
  await expect(idCell).toHaveAttribute("title", "amenity/clinic/abortion");
});

test("preset table columns share a fixed width", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await loadTestSchema(page);
  await expect(page.locator("table thead th").nth(1)).toBeVisible();

  const widths = await page
    .locator("table thead tr th")
    .evaluateAll((ths) => ths.slice(1).map((th) => Math.round(th.getBoundingClientRect().width)));

  expect(widths.length).toBeGreaterThan(1);
  expect(new Set(widths).size).toBe(1);
  expect(widths[0]).toBe(160);
});

test("preset table column headers expose full name and id via title", async ({ page }) => {
  await loadTestSchema(page);

  const header = page.locator("thead th").filter({ hasText: "amenity/clinic/abortion" });
  await expect(header.locator("span.font-mono")).toHaveAttribute(
    "title",
    "amenity/clinic/abortion",
  );
  await expect(header.locator("button > span > span[title]").first()).toHaveAttribute(
    "title",
    /.+/,
  );
  await expect(header.locator("button")).not.toHaveAttribute("title");
});

test("preset table name row wraps instead of truncating", async ({ page }) => {
  await loadTestSchema(page);

  const nameRow = page.locator("tbody tr", { has: page.locator("th", { hasText: /^Name$/ }) });
  const nameCell = nameRow.locator("td").first();
  await expect(nameCell).toBeVisible();

  const style = await nameCell.locator("span.break-words").evaluate((el) => ({
    overflowWrap: getComputedStyle(el).overflowWrap,
    hyphens: getComputedStyle(el).hyphens,
    whiteSpace: getComputedStyle(el).whiteSpace,
  }));

  expect(style.overflowWrap).toBe("break-word");
  expect(style.hyphens).toBe("auto");
  expect(style.whiteSpace).toBe("normal");
});

test("field stringsCrossReference shows dereferenced label on fields page", async ({ page }) => {
  await page.goto("/fields?dataUrl=/test-schema");
  await expect(page.getByRole("heading", { name: /^Fields\b/i })).toBeVisible();
  await expect(page.getByText("Free Menstrual Products Available").first()).toBeVisible();
  await expect(page.getByText("{test/menstrual_products}")).toHaveCount(0);
});

test("field detail resolves stringsCrossReference label and options", async ({ page }) => {
  await page.goto("/field/test/menstrual_products_poi?dataUrl=/test-schema");
  await expect(
    page.getByRole("heading", { name: "Free Menstrual Products Available" }),
  ).toBeVisible();
  await expect(page.getByText("Yes, in all stalls")).toBeVisible();
  await expect(page.getByText("Limited to some stalls")).toBeVisible();
});

test("field source JSON shows dereferenced values with reference annotation", async ({ page }) => {
  await page.goto("/field/test/menstrual_products_poi?dataUrl=/test-schema");
  await expect(page.getByRole("button", { name: /Source field/i })).toBeVisible();
  const source = page.locator(".overflow-x-auto.bg-slate-50.font-mono");
  await expect(source.getByText("Free Menstrual Products Available").first()).toBeVisible();
  await expect(source.getByText("ref {test/menstrual_products}")).toHaveCount(2);
  await expect(source.getByText("3 option strings")).toBeVisible();
});

test("preset table icon row truncates long icon names", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await loadTestSchema(page);

  const iconRow = page.locator("tbody tr", { has: page.locator("th", { hasText: /^Icon$/ }) });
  const iconCell = iconRow
    .locator("td")
    .filter({ hasText: "temaki-this-icon-does-not-exist" })
    .first();
  await expect(iconCell).toBeVisible();

  const truncation = await iconCell.locator("span.truncate").evaluate((el) => ({
    textOverflow: getComputedStyle(el).textOverflow,
    isOverflowing: el.scrollWidth > el.clientWidth,
  }));

  expect(truncation.textOverflow).toBe("ellipsis");
  expect(truncation.isOverflowing).toBe(true);
});
