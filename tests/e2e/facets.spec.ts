import { expect, test } from "@playwright/test";

test("preset facets are visible and populated in left navigation", async ({ page }) => {
  await page.goto("/?dataUrl=/test-schema");

  await expect(page.getByText("Faceted Search")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Primary tag" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fields" })).toBeVisible();

  await expect(page.getByRole("button", { name: /amenity/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^shop\b/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /name/i })).toBeVisible();
});
