import { expect, test } from "@playwright/test";
import path from "node:path";

test("staff can open the ticket queue", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/email address/i).fill("somchai.jaidee@example.com");
  await page.getByLabel(/^password$/i).fill("Password123!");
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
  await expect(page.getByRole("heading", { name: /it staff ticket queue/i })).toBeVisible();
  await expect(page.getByLabel(/search/i)).toBeVisible();
});

test("captures the authenticated requester interface", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByLabel(/email address/i).fill("narin.chaiyo@example.com");
  await page.getByLabel(/^password$/i).fill("Password123!");
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();

  await expect(page.getByRole("heading", { name: /my tickets/i })).toBeVisible();
  await expect(page.getByText(/loading tickets/i)).toBeHidden();

  await page.screenshot({
    path: path.join(
      testInfo.config.rootDir,
      "..",
      "artifacts",
      "lab-03",
      "screenshots",
      "staff-ticket-detail",
      `requester-interface-${testInfo.project.name}.png`,
    ),
  });
});
