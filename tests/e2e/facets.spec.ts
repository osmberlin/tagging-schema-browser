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

  await expect(page.getByText(/\d+ presets? references? a missing icon/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "show broken icons" })).toBeVisible();
  await expect(page.locator("aside").getByRole("button", { name: /^broken\b/i })).toBeVisible();

  await page.getByRole("button", { name: "show broken icons" }).click();
  await expect(page.getByRole("button", { name: "Has icon: broken" })).toBeVisible();
  await expect(page.getByText("temaki-this-icon-does-not-exist")).toBeVisible();
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

test("name preset ref shows inherited labels from referenced preset", async ({ page }) => {
  await page.goto("/preset/shop/ice_cream?dataUrl=/test-schema");
  await page
    .getByRole("button", { name: /"\{amenity\/ice_cream\}"/ })
    .last()
    .click();
  await expect(page.getByText('"Gelateria"')).toBeVisible();
  await expect(page.getByText('"froyo"')).toBeVisible();
  await expect(page.getByText('"gelato"')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ice Cream Shop" })).toBeVisible();
});
