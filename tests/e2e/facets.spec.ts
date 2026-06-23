import { expect, test } from "@playwright/test";

test("preset facets are visible and populated in left navigation", async ({ page }) => {
  await page.goto("/?dataUrl=/test-schema");

  await expect(page.getByText("Faceted Search")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Primary tag" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fields" })).toBeVisible();

  await expect(page.getByRole("button", { name: /^amenity\b/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^shop\b/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /name/i })).toBeVisible();
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
