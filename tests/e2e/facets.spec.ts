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

test("broken option icons are flagged on presets page", async ({ page }) => {
  await loadTestSchema(page);

  await expect(page.getByText(/1 preset has a missing option icon/i)).toBeVisible();
  await expect(page.getByText("temaki-missing-option-icon")).toBeVisible();
});

test("icons page tracks option icon usage", async ({ page }) => {
  await loadTestSchema(page);
  await page.goto("/icons?dataUrl=/test-schema");

  await expect(page.getByRole("heading", { name: /^Icons\b/i })).toBeVisible();
  await expect(page.getByText("Used by presets or options")).toBeVisible();
  await expect(page.locator("[data-icon='roentgen-bump']")).toBeVisible();
  await expect(page.locator("[data-icon='roentgen-bump']").getByText("Options")).toBeVisible();
});

test("preset detail shows options with child preset links", async ({ page }) => {
  await loadTestSchema(page);
  await page.goto("/?dataUrl=/test-schema&preset=man_made%2Fcrane");

  await expect(page.getByRole("heading", { name: "Options" })).toBeVisible();
  await expect(page.getByRole("button", { name: /→ Portal Crane/i })).toBeVisible();

  await page.getByRole("button", { name: /→ Portal Crane/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("paragraph").filter({ hasText: "man_made/crane/portal_crane" }),
  ).toBeVisible();
});
