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

  await expect(page.getByText(/1 preset references a missing icon/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "show broken icons" })).toBeVisible();
  await expect(page.locator("aside").getByRole("button", { name: /^broken\b/i })).toBeVisible();

  await page.getByRole("button", { name: "show broken icons" }).click();
  await expect(page.getByRole("button", { name: "Has icon: broken" })).toBeVisible();
  await expect(page.getByText("temaki-this-icon-does-not-exist")).toBeVisible();
});
