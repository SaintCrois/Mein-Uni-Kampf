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
    .fill("Lab 4 E2E resolution workflow verification ticket.");
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

test.describe("Lab 4 E2E-WF: Ticket resolution workflow", () => {
  test("E2E-WF-01/02: advisory requester indication, formal staff resolution, and closure", async ({
    page,
  }, testInfo) => {
    test.setTimeout(240000);
    // Terminal transition confirmation dialogs are accepted automatically.
    page.on("dialog", (dialog) => void dialog.accept());

    const runId = `${Date.now()}`;
    const summary = `E2E Resolution ${runId}`;

    // -------------------------------------------------------------------------
    // Requester creates a ticket (status starts at New).
    // -------------------------------------------------------------------------
    await login(page, "narin.chaiyo@example.com");
    const ticketNumber = await createTicket(page, summary);
    await openRequesterTicket(page, ticketNumber);

    await expect(page.getByLabel("Current Status")).toHaveValue("New");

    // -------------------------------------------------------------------------
    // Requester signals "Problem Appears Resolved" — advisory only.
    // -------------------------------------------------------------------------
    await page
      .getByRole("button", { name: /mark as problem appears resolved/i })
      .click();
    await expect(
      page.getByText("Advisory: Appears Resolved"),
    ).toBeVisible();
    // The formal status must remain unchanged by the advisory signal.
    await expect(page.getByLabel("Current Status")).toHaveValue("New");
    await expect(
      page.locator("p", { hasText: /advisory signal only/i }),
    ).toContainText("stays New");

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
        path: path.join(dir, "resolution-requester-advisory.png"),
        fullPage: true,
      });
    }

    await logout(page);

    // -------------------------------------------------------------------------
    // IT Staff claims the ticket, logs an Action Taken, and formally resolves.
    // -------------------------------------------------------------------------
    await login(page, "somchai.jaidee@example.com");
    await openStaffTicket(page, ticketNumber);

    // Advisory banner is visible to staff; formal status is still New.
    await expect(
      page.getByText(/requester has indicated this problem appears resolved/i),
    ).toBeVisible();

    await page.getByRole("button", { name: /claim ticket/i }).click();
    await expect(page.getByText(/ticket claimed successfully/i)).toBeVisible();

    // New -> Open (claim), then Open -> Resolved is a documented transition.
    await page.getByRole("button", { name: /\+ add action taken/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByLabel(/action description/i)
      .fill(`Verified configuration for ${runId}`);
    await dialog.getByLabel(/^result/i).fill("Service restored and confirmed.");
    await dialog.getByRole("button", { name: "Create Action Taken" }).click();
    await expect(
      page.getByText(/action taken recorded successfully/i),
    ).toBeVisible();

    // Formal resolution by IT Staff (acknowledge from the advisory banner).
    await page
      .getByRole("button", { name: /acknowledge & mark resolved/i })
      .click();
    await expect(
      page.getByText(/status transitioned to "Resolved"/i),
    ).toBeVisible();
    await expect(page.locator("span", { hasText: /Current Status:/ }).first()).toContainText("Resolved");

    // Formal closure: Resolved -> Closed is a documented terminal transition.
    await page.getByLabel(/next status/i).selectOption("Closed");
    await page.getByRole("button", { name: /update status/i }).click();
    await expect(
      page.getByText(/status transitioned to "Closed"/i),
    ).toBeVisible();
    await expect(
      page.getByText(/terminal status/i).first(),
    ).toBeVisible();
    // Terminal state: no further transitions are offered.
    await expect(page.getByLabel(/next status/i)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /update status/i }),
    ).toHaveCount(0);

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
        path: path.join(dir, "resolution-staff-closed.png"),
        fullPage: true,
      });
    }

    await logout(page);

    // -------------------------------------------------------------------------
    // Requester sees the formal resolution while the advisory signal is kept.
    // -------------------------------------------------------------------------
    await login(page, "narin.chaiyo@example.com");
    await openRequesterTicket(page, ticketNumber);

    await expect(page.getByLabel("Current Status")).toHaveValue("Closed");
    await expect(
      page.getByText("Advisory: Appears Resolved"),
    ).toBeVisible();
    // Requesters never get workflow controls.
    await expect(
      page.getByRole("button", { name: /update status/i }),
    ).toHaveCount(0);
  });
});

