import { expect, test } from "@playwright/test";

test("staff can open the ticket queue", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/email address/i).fill("somchai.jaidee@example.com");
  await page.getByLabel(/^password$/i).fill("Password123!");
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
  await expect(page.getByRole("heading", { name: /it staff ticket queue/i })).toBeVisible();
  await expect(page.getByLabel(/search/i)).toBeVisible();
});
