import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string, password = "Password123!") {
  await page.goto("/");
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
}

test("authenticates an administrator and logs out", async ({ page }) => {
  await login(page, "admin@example.com");
  await expect(page.getByText("User Management").first()).toBeVisible();
  await page.getByRole("button", { name: /logout/i }).click();
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
});

test("forces first-login password change", async ({ page }) => {
  await login(page, "thanawat.saelim@example.com");
  await expect(page.getByText(/created with an initial password/i)).toBeVisible();
});
