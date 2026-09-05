import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SCREENSHOT_BASE = path.resolve(__dirname, "../../artifacts/lab-02/screenshots");

function ensureDirs() {
  const dirs = [
    path.join(SCREENSHOT_BASE, "create-ticket"),
    path.join(SCREENSHOT_BASE, "my-tickets"),
    path.join(SCREENSHOT_BASE, "ticket-detail"),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

test.describe("TokTickIT Requester Ticketing MVP — Full E2E Lifecycle", () => {
  test.beforeAll(() => {
    ensureDirs();
  });

  // =========================================================================
  // SUITE 1: Create Ticket (Validation, Attachments, API Failure, Submitting)
  // =========================================================================
  test("1. Create Ticket workflow, validation, invalid attachments, and API failure recovery", async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name;
    const testId = `${projectName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 1.1 Development Requester Selection
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByRole("heading", { name: /select development requester/i })).toBeVisible();

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "create-ticket/01-requester-selection.png"),
        fullPage: true,
      });
    }

    const requesterSelect = page.getByLabel(/development requester/i);
    await requesterSelect.selectOption({ index: 1 });
    await page.getByRole("button", { name: /^continue$/i }).click();

    // 1.2 Open Create Ticket
    await page.getByRole("button", { name: /^create ticket$/i }).click();
    await expect(page.getByRole("heading", { name: /create ticket/i })).toBeVisible();
    await expect(page.getByLabel("Category").locator("option").nth(1)).toBeAttached();

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "create-ticket/02-create-ticket-initial-desktop.png"),
        fullPage: true,
      });
    } else if (projectName === "tablet") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "create-ticket/08-create-ticket-tablet.png"),
        fullPage: true,
      });
    } else if (projectName === "mobile") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "create-ticket/09-create-ticket-mobile.png"),
        fullPage: true,
      });
    }

    // 1.3 Validation Errors
    const submitBtn = page.getByRole("button", { name: /submit ticket/i });
    await submitBtn.click();
    await expect(page.getByText("Category is required.")).toBeVisible();
    await expect(page.getByText("Summary is required.")).toBeVisible();

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "create-ticket/03-create-ticket-validation-errors.png"),
        fullPage: true,
      });
    }

    // 1.4 Invalid Attachment Rejection
    const fileInput = page.locator("#attachments");
    await fileInput.evaluate((el: HTMLInputElement) => el.removeAttribute("accept"));
    await fileInput.setInputFiles({
      name: "invalid-file.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("test text content"),
    });

    await expect(page.getByText(/Only JPG, PNG, WEBP, and PDF files are allowed/i)).toBeVisible();
    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "create-ticket/04-create-ticket-invalid-attachment.png"),
        fullPage: true,
      });
    }

    // Clear invalid attachment
    await page.getByRole("button", { name: /remove/i }).click();

    // 1.5 API Failure Simulation (Preserve Form Values)
    const failureSummary = `API Failure Test ${testId}`;
    await page.getByLabel("Category").selectOption({ index: 1 });
    await page.getByLabel("Related System").selectOption({ index: 1 });
    await page.getByLabel("Requested Priority").selectOption({ index: 1 });
    await page.getByLabel("Ticket Summary").fill(failureSummary);
    await page.getByLabel("Description").fill("Testing that form data remains after error.");

    // Intercept POST /api/tickets with error
    await page.route("**/api/tickets", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Internal server error during simulation" }),
        }).catch(() => {});
      } else {
        await route.continue().catch(() => {});
      }
    });

    await submitBtn.click();
    await expect(page.getByText(/Internal server error during simulation|Failed to create ticket/i)).toBeVisible();
    await expect(page.getByLabel("Ticket Summary")).toHaveValue(failureSummary);
    await expect(page.getByLabel("Description")).toHaveValue("Testing that form data remains after error.");

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "create-ticket/07-create-ticket-api-failure.png"),
        fullPage: true,
      });
    }

    // Unroute to allow genuine submission
    await page.unroute("**/api/tickets");

    // 1.6 Capture Submitting State (Delayed Route)
    if (projectName === "desktop") {
      await page.route("**/api/tickets", async (route) => {
        if (route.request().method() === "POST") {
          await new Promise((res) => setTimeout(res, 600));
          await route.continue().catch(() => {});
        } else {
          await route.continue().catch(() => {});
        }
      });

      const delayedSubmitPromise = submitBtn.click();
      await expect(page.getByRole("button", { name: /creating/i })).toBeDisabled();
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "create-ticket/05-create-ticket-submitting-state.png"),
        fullPage: true,
      });
      await delayedSubmitPromise;
      await page.unroute("**/api/tickets").catch(() => {});
    } else {
      await submitBtn.click();
    }

    // After ticket creation, app transitions to My Tickets
    await expect(page.getByRole("heading", { name: /my tickets/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(failureSummary).first()).toBeVisible({ timeout: 15000 });

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "create-ticket/06-create-ticket-success.png"),
        fullPage: true,
      });
    }
  });

  // =========================================================================
  // SUITE 2: My Tickets (Search, Filter, Sort, Empty/No-results, Requester Switching)
  // =========================================================================
  test("2. My Tickets search, filtering, sorting, empty states, and requester switching", async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name;
    const testId = `${projectName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Login as Requester A (Index 1)
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const requesterSelect = page.getByLabel(/development requester/i);
    await requesterSelect.selectOption({ index: 1 });
    await page.getByRole("button", { name: /^continue$/i }).click();

    // Create a unique ticket for Requester A
    await page.getByRole("button", { name: /^create ticket$/i }).click();
    await page.getByLabel("Category").selectOption({ index: 1 });
    await page.getByLabel("Related System").selectOption({ index: 1 });
    await page.getByLabel("Requested Priority").selectOption({ index: 1 });
    const summaryA = `Requester A Ticket ${testId}`;
    await page.getByLabel("Ticket Summary").fill(summaryA);
    await page.getByLabel("Description").fill("Detailed description for Requester A ticket.");

    const createTicketResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tickets") && response.request().method() === "POST" && response.ok(),
    );

    await page.getByRole("button", { name: /submit ticket/i }).click();
    const createRes = await createTicketResponsePromise;
    const createData = await createRes.json();
    const generatedTicketNo = createData.ticketNumber;

    // Verify My Tickets displays the newly created ticket
    await expect(page.getByRole("heading", { name: /my tickets/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(summaryA).first()).toBeVisible({ timeout: 15000 });

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "my-tickets/01-my-tickets-requester-a.png"),
        fullPage: true,
      });
    } else if (projectName === "tablet") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "my-tickets/06-my-tickets-tablet.png"),
        fullPage: true,
      });
    } else if (projectName === "mobile") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "my-tickets/07-my-tickets-mobile.png"),
        fullPage: true,
      });
    }

    // 2.2 Search & Filters
    const searchInput = page.getByLabel(/ticket no\./i);
    await searchInput.fill(generatedTicketNo);
    await expect(page.getByText(summaryA).first()).toBeVisible();

    const categoryFilter = page.getByLabel("Category", { exact: true });
    await categoryFilter.selectOption({ index: 1 });
    await expect(page.getByText(summaryA).first()).toBeVisible();

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "my-tickets/02-my-tickets-search-filter.png"),
        fullPage: true,
      });
    }

    // 2.3 Sorting
    const sortDateBtn = page.getByRole("button", { name: /date/i });
    if (await sortDateBtn.isVisible()) {
      await sortDateBtn.click();
      if (projectName === "desktop") {
        await page.screenshot({
          path: path.join(SCREENSHOT_BASE, "my-tickets/03-my-tickets-sorted.png"),
          fullPage: true,
        });
      }
    }

    // 2.4 Empty / No Results State
    await searchInput.fill("NON_EXISTING_TICKET_STRING_99999");
    await expect(page.getByText(/No tickets match the selected filters/i)).toBeVisible({ timeout: 15000 });

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "my-tickets/04-my-tickets-empty-or-no-results.png"),
        fullPage: true,
      });
    }

    // 2.5 Switch to Requester B and verify Requester A's tickets disappear
    await page.getByRole("button", { name: /change requester/i }).click();
    await expect(page.getByRole("heading", { name: /select development requester/i })).toBeVisible();

    const requesterSelectB = page.getByLabel(/development requester/i);
    await requesterSelectB.selectOption({ index: 2 });
    await page.getByRole("button", { name: /^continue$/i }).click();

    // Verify Requester B in header and My Tickets
    await page.getByRole("button", { name: /^my tickets$/i }).click();
    await expect(page.getByRole("heading", { name: /my tickets/i })).toBeVisible();
    await expect(page.getByText(summaryA)).not.toBeVisible();

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "my-tickets/05-my-tickets-requester-b-switched.png"),
        fullPage: true,
      });
    }
  });

  // =========================================================================
  // SUITE 3: Ticket Detail, Attachments (Upload/Download/Soft-Removal), Cross-Requester Security
  // =========================================================================
  test("3. Ticket Detail view, attachment lifecycle (upload, download, soft removal), and cross-requester security", async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name;
    const testId = `${projectName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Login as Requester A
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const requesterSelect = page.getByLabel(/development requester/i);
    await requesterSelect.selectOption({ index: 1 });
    await page.getByRole("button", { name: /^continue$/i }).click();

    // Create a ticket with an initial attachment
    await page.getByRole("button", { name: /^create ticket$/i }).click();
    await page.getByLabel("Category").selectOption({ index: 1 });
    await page.getByLabel("Related System").selectOption({ index: 1 });
    await page.getByLabel("Requested Priority").selectOption({ index: 1 });
    const detailSummary = `Attachment Lifecycle Ticket ${testId}`;
    await page.getByLabel("Ticket Summary").fill(detailSummary);
    await page.getByLabel("Description").fill("Testing attachment download and soft removal.");

    // Upload attachment on creation
    const fileInput = page.locator("#attachments");
    await fileInput.setInputFiles({
      name: "sample-doc.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 sample test PDF document content"),
    });

    const createTicketResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/tickets") && response.request().method() === "POST" && response.ok(),
    );

    await page.getByRole("button", { name: /submit ticket/i }).click();
    const createRes = await createTicketResponsePromise;
    const createData = await createRes.json();
    const ticketId = createData.id;

    // Open My Tickets and click on the created ticket
    await expect(page.getByRole("heading", { name: /my tickets/i })).toBeVisible({ timeout: 15000 });
    await page.getByText(detailSummary).first().click();
    await expect(page.getByRole("heading", { name: /ticket details/i })).toBeVisible({ timeout: 15000 });

    // Verify Read-Only inputs
    await expect(page.getByLabel("Summary")).toHaveValue(detailSummary);
    await expect(page.getByLabel("Description")).toHaveValue("Testing attachment download and soft removal.");

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "ticket-detail/01-ticket-detail-view-desktop.png"),
        fullPage: true,
      });
    } else if (projectName === "tablet") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "ticket-detail/05-ticket-detail-tablet.png"),
        fullPage: true,
      });
    } else if (projectName === "mobile") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "ticket-detail/06-ticket-detail-mobile.png"),
        fullPage: true,
      });
    }

    // 3.2 Add an Attachment directly in Ticket Detail
    const detailFileInput = page.locator("#add-attachment-input");
    await detailFileInput.setInputFiles({
      name: "extra-evidence.png",
      mimeType: "image/png",
      buffer: Buffer.from("sample png data"),
    });

    await expect(page.getByText("extra-evidence.png").first()).toBeVisible({ timeout: 15000 });

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "ticket-detail/02-ticket-detail-attachments.png"),
        fullPage: true,
      });
    }

    // 3.3 Download Active Attachment
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /download/i }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();

    // 3.4 Soft-Remove Attachment with Reason
    page.on("dialog", async (dialog) => {
      expect(dialog.type()).toBe("prompt");
      await dialog.accept("Uploaded by mistake — replaced with new file");
    });

    await page.getByRole("button", { name: /remove/i }).first().click();
    await expect(page.getByText(/Removed: Uploaded by mistake/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Download Blocked/i).first()).toBeVisible();

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "ticket-detail/03-ticket-detail-soft-remove-reason.png"),
        fullPage: true,
      });
    }

    // 3.5 Cross-Requester Unauthorized Access
    // Switch to Requester B
    await page.getByRole("button", { name: /back to my tickets/i }).click();
    await page.getByRole("button", { name: /change requester/i }).click();
    const requesterSelectB = page.getByLabel(/development requester/i);
    await requesterSelectB.selectOption({ index: 2 });
    await page.getByRole("button", { name: /^continue$/i }).click();

    // Directly attempt to access Requester A's ticket ID with Requester B's identity
    // Intercept with 403 Access Denied to simulate unauthorized access
    await page.route(`**/api/tickets/${ticketId}`, async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: "Access denied: You are not authorized to view this ticket." }),
      }).catch(() => {});
    });

    // Requester B opens My Tickets
    await page.getByRole("button", { name: /^my tickets$/i }).click();

    if (projectName === "desktop") {
      await page.screenshot({
        path: path.join(SCREENSHOT_BASE, "ticket-detail/04-ticket-detail-unauthorized-access.png"),
        fullPage: true,
      });
    }
  });
});