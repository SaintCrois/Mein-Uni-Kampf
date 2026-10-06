import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const PASSWORD = "Password123!";

async function login(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill(PASSWORD);
  await page.locator("form").getByRole("button", { name: /^sign in$/i }).click();
  await expect(page.getByRole("button", { name: /sign out|logout/i })).toBeVisible();
}

async function logout(page: Page) {
  await page.getByRole("button", { name: /logout/i }).click();
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
}

async function createTicket(page: Page, summary: string): Promise<string> {
  const created = page.waitForResponse(
    (response) =>
      response.url().includes("/api/tickets") &&
      response.request().method() === "POST" &&
      response.ok(),
    { timeout: 15000 },
  );

  await page.getByRole("button", { name: /create ticket/i }).click();
  await page.getByLabel("Category").selectOption({ index: 1 });
  await page.getByLabel("Related System").selectOption({ index: 1 });
  await page.getByLabel("Requested Priority").selectOption({ index: 1 });
  await page.getByLabel("Ticket Summary").fill(summary);
  await page
    .getByLabel("Description")
    .fill("Lab 4 E2E action taken lifecycle verification ticket.");
  await page.getByRole("button", { name: /submit ticket/i }).click();

  const response = await created;
  const body = await response.json();
  return body.ticketNumber as string;
}

async function openRequesterTicket(page: Page, ticketNumber: string) {
  await page.getByRole("button", { name: /^my tickets$/i }).click();
  await page.getByLabel("Search").fill(ticketNumber);
  await page
    .getByRole("button", { name: new RegExp(`^${ticketNumber}$`, "i") })
    .click();
}

async function openStaffTicket(page: Page, ticketNumber: string) {
  await page.getByRole("button", { name: "Ticket Queue", exact: true }).click();
  const search = page.getByLabel(/search/i);
  await search.fill(ticketNumber);
  // The staff queue applies the search term when the filter form is submitted.
  await search.press("Enter");
  await page
    .getByRole("button", { name: /view ticket/i })
    .filter({ visible: true })
    .first()
    .click();
}

test.describe("Lab 4 E2E-ACT: Actions Taken lifecycle", () => {
  test("E2E-ACT-01/02: staff creates and edits an Action Taken; requester sees it read-only", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180000);
    const runId = `${Date.now()}`;
    const summary = `E2E Actions Taken ${runId}`;
    const actionDescription = `Diagnosed faulty cable ${runId}`;
    const updatedResult = `Replacement cable installed and verified ${runId}`;

    // Requester creates the ticket that staff will work on.
    await login(page, "narin.chaiyo@example.com");
    const ticketNumber = await createTicket(page, summary);

    // Fresh ticket: Actions Taken section exists and is read-only for requesters.
    await openRequesterTicket(page, ticketNumber);
    await expect(
      page.getByRole("heading", { name: /^actions taken$/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/no actions taken have been recorded/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /add action taken/i }),
    ).toHaveCount(0);

    await logout(page);

    // IT Staff records an Action Taken with a follow-up requirement.
    await login(page, "somchai.jaidee@example.com");
    await openStaffTicket(page, ticketNumber);

    await expect(
      page.getByRole("heading", { name: /^actions taken$/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /\+ add action taken/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Add Action Taken")).toBeVisible();

    await dialog.getByLabel(/action description/i).fill(actionDescription);
    await dialog.getByLabel(/^result/i).fill("Cable continuity test failed.");
    await dialog.getByLabel(/follow-up required/i).check();
    await dialog.getByLabel(/follow-up note/i).fill("Replace cable and retest.");
    await dialog.getByRole("button", { name: "Create Action Taken" }).click();

    await expect(
      page.getByText(/action taken recorded successfully/i),
    ).toBeVisible();
    const item = page.getByTestId("action-taken-item").first();
    await expect(item).toContainText(actionDescription);
    await expect(item).toContainText("Follow-Up Required");

    if (testInfo.project.name === "desktop") {
      const dir = path.join(
        testInfo.config.rootDir,
        "..",
        "artifacts",
        "lab-04",
        "screenshots",
      );
      fs.mkdirSync(dir, { recursive: true });
      await page.screenshot({
        path: path.join(dir, "actions-taken-staff.png"),
        fullPage: true,
      });
    }

    // IT Staff edits the same Action Taken.
    await page.getByRole("button", { name: "Edit" }).first().click();
    const editDialog = page.getByRole("dialog");
    await expect(editDialog.getByText("Edit Action Taken")).toBeVisible();
    await expect(editDialog.getByLabel(/action description/i)).toHaveValue(
      actionDescription,
    );
    await editDialog.getByLabel(/^result/i).fill(updatedResult);
    await editDialog.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByText(/action taken updated successfully/i),
    ).toBeVisible();
    await expect(page.getByTestId("action-taken-item").first()).toContainText(
      updatedResult,
    );

    await logout(page);

    // Requester views the recorded work read-only.
    await login(page, "narin.chaiyo@example.com");
    await openRequesterTicket(page, ticketNumber);

    const requesterItem = page.getByTestId("action-taken-item").first();
    await expect(requesterItem).toContainText(actionDescription);
    await expect(requesterItem).toContainText(updatedResult);
    await expect(
      page.getByRole("button", { name: /add action taken/i }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);

    // View modal is available but offers no edit trigger for requesters.
    await page.getByRole("button", { name: "View" }).first().click();
    await expect(
      page.getByRole("dialog").getByText("Action Taken Details"),
    ).toBeVisible();
    await expect(
      page
        .getByRole("dialog")
        .getByRole("button", { name: /edit action taken/i }),
    ).toHaveCount(0);
  });
});

