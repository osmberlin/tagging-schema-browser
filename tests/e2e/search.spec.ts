import { expect, test } from "@playwright/test";

test("preset search matches full path and path segment", async ({ page }) => {
  await page.goto("/?dataUrl=/test-schema&q=amenity%2Fcafe");
  await expect(page.getByRole("heading", { name: /^Presets\b/i })).toBeVisible();
  await expect(page.locator("table thead th").filter({ hasText: "amenity/cafe" })).toBeVisible();

  await page.goto("/?dataUrl=/test-schema&q=cafe");
  await expect(page.locator("table thead th").filter({ hasText: "amenity/cafe" })).toBeVisible();
});

test("preset search finds unsearchable preset by path segment", async ({ page }) => {
  await page.goto("/?dataUrl=/test-schema&q=ice_cream");
  await expect(page.getByRole("heading", { name: /^Presets\b/i })).toBeVisible();
  await expect(page.locator("table thead th").filter({ hasText: "shop/ice_cream" })).toBeVisible();
});

test("translations search includes unsearchable preset only when querying", async ({ page }) => {
  await page.goto("/translations?dataUrl=/test-schema");
  await expect(page.getByRole("heading", { name: /^Translations\b/i })).toBeVisible();
  await expect(page.getByText("shop/ice_cream")).toHaveCount(0);

  await page.goto("/translations?dataUrl=/test-schema&q=ice_cream");
  await expect(page.getByText("shop/ice_cream")).toBeVisible();
});

test("translations search matches Transifex-style preset keys", async ({ page }) => {
  await page.goto("/translations?dataUrl=/test-schema&q=presets.presets.amenity%2Fcafe.name");
  await expect(page.getByText("amenity/cafe")).toBeVisible();
});

test("field search accepts slashes in the query", async ({ page }) => {
  await page.goto("/fields?dataUrl=/test-schema");
  await expect(page.getByRole("heading", { name: /^Fields\b/i })).toBeVisible();

  const search = page.locator("#page-search-input");
  await search.click();
  await search.pressSequentially("healthcare/", { delay: 50 });
  await expect(search).toHaveValue("healthcare/");
  await expect(page.locator("[data-field='healthcare/speciality']")).toBeVisible();
});
