import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const PASSWORD = "Password123!";
async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/");
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill(PASSWORD);
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
}

test("E2E-DASH-01: requester dashboard renders and drills into My Tickets", async ({ page }, testInfo) => {
  await login(page, "narin.chaiyo@example.com");
  await expect(page.getByRole("heading", { name: "Requester Dashboard" })).toBeVisible();
  const screenshotDir = path.join(testInfo.config.rootDir, "..", "artifacts", "lab-04", "screenshots");
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, `requester-dashboard-${testInfo.project.name}.png`), fullPage: true });
  await page.getByRole("button", { name: /open tickets/i }).click();
  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
});

test("E2E-DASH-01: IT Staff dashboard renders and drills into Ticket Queue", async ({ page }, testInfo) => {
  await login(page, "somchai.jaidee@example.com");
  await expect(page.getByRole("heading", { name: "IT Staff Operational Dashboard" })).toBeVisible();
  const screenshotDir = path.join(testInfo.config.rootDir, "..", "artifacts", "lab-04", "screenshots");
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, `staff-dashboard-${testInfo.project.name}.png`), fullPage: true });
  await page.getByRole("button", { name: /unassigned tickets/i }).click();
  await expect(page.getByRole("heading", { name: /it staff ticket queue/i })).toBeVisible();
});
