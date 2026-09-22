import { expect, test } from "@playwright/test";

test("administrator opens user management and user creation form", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/email address/i).fill("admin@example.com");
  await page.getByLabel(/^password$/i).fill("Password123!");
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
  await expect(page.getByRole("heading", { name: /user management/i })).toBeVisible();
  await page.getByRole("button", { name: /create new user/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel(/initial password/i)).toBeVisible();
});
