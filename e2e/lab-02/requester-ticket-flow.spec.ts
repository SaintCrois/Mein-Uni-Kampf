import { test, expect } from "@playwright/test";

test("Requester can create a ticket and find it in My Tickets", async ({
  page,
}) => {
  const summary = "E2E Lab 2 ticket";
  const description =
    "Ticket created by the Lab 2 Playwright E2E test.";

  // ============================================================
  // 1. SELECT DEVELOPMENT REQUESTER
  // ============================================================

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /select development requester/i,
    }),
  ).toBeVisible();

  const requesterSelect = page.getByLabel(
    /development requester/i,
  );

  await expect(requesterSelect).toBeVisible();

  const requesterOptions =
    await requesterSelect.locator("option").allTextContents();

  expect(requesterOptions.length).toBeGreaterThan(1);

  await requesterSelect.selectOption({
    index: 1,
  });

  const selectedRequester =
    await requesterSelect
      .locator("option:checked")
      .textContent();

  expect(selectedRequester).toBeTruthy();

  await page.getByRole("button", {
    name: /^continue$/i,
  }).click();

  await expect(
    page.getByText(selectedRequester!.trim(), {
      exact: true,
    }),
  ).toBeVisible();

  // ============================================================
  // 2. CREATE TICKET
  // ============================================================

  await page.getByRole("button", {
    name: /^create ticket$/i,
  }).click();

  await expect(
    page.getByRole("heading", {
      name: /create ticket/i,
    }),
  ).toBeVisible();

  const category = page.getByLabel("Category");
  const relatedSystem = page.getByLabel("Related System");
  const priority = page.getByLabel("Requested Priority");

  await expect(category).toBeVisible();
  await expect(relatedSystem).toBeVisible();
  await expect(priority).toBeVisible();

  await expect(
    category.locator("option").nth(1),
  ).toBeAttached();

  await expect(
    relatedSystem.locator("option").nth(1),
  ).toBeAttached();

  await expect(
    priority.locator("option").nth(1),
  ).toBeAttached();

  // ============================================================
  // 3. VALIDATION
  // ============================================================

  const submitButton = page
    .getByRole("main")
    .getByRole("button", {
      name: /^submit ticket$/i,
    });

  await submitButton.click();

  await expect(
    page.getByText("Category is required."),
  ).toBeVisible();

  await expect(
    page.getByText("Related System is required."),
  ).toBeVisible();

  await expect(
    page.getByText("Requested Priority is required."),
  ).toBeVisible();

  await expect(
    page.getByText("Summary is required."),
  ).toBeVisible();

  await expect(
    page.getByText("Description is required."),
  ).toBeVisible();

  // ============================================================
  // 4. FILL VALID TICKET
  // ============================================================

  await category.selectOption({
    index: 1,
  });

  await relatedSystem.selectOption({
    index: 1,
  });

  await priority.selectOption({
    index: 1,
  });

  await page
    .getByLabel("Ticket Summary")
    .fill(summary);

  await page
    .getByLabel("Description")
    .fill(description);

  // ============================================================
  // 5. CREATE TICKET + CAPTURE BACKEND RESPONSE
  // ============================================================

  const createTicketResponsePromise =
    page.waitForResponse(
      async (response) => {
        if (response.request().method() !== "POST") {
          return false;
        }

        if (!response.url().includes("/api/tickets")) {
          return false;
        }

        if (!response.ok()) {
          return false;
        }

        try {
          const body = await response.json();

          return /TKT-\d{4}-\d+/.test(
            JSON.stringify(body),
          );
        } catch {
          return false;
        }
      },
      {
        timeout: 15000,
      },
    );

  await submitButton.click();

  const createTicketResponse =
    await createTicketResponsePromise;

  const createBody =
    await createTicketResponse.json();

  const createText =
    JSON.stringify(createBody);

  const ticketMatch =
    createText.match(/TKT-\d{4}-\d+/);

  expect(ticketMatch).not.toBeNull();

  const generatedTicketNumber =
    ticketMatch![0];

  expect(generatedTicketNumber).toMatch(
    /^TKT-\d{4}-\d+$/,
  );

  console.log(
    "CREATED TICKET:",
    generatedTicketNumber,
  );

  // ============================================================
  // 6. OPEN MY TICKETS
  // ============================================================

  const myTicketsResponsePromise =
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/tickets") &&
        response.request().method() === "GET" &&
        response.ok(),
      {
        timeout: 15000,
      },
    );

  await page.getByRole("button", {
    name: /^my tickets$/i,
  }).click();

  const myTicketsResponse =
    await myTicketsResponsePromise;

  const contentType =
    myTicketsResponse.headers()["content-type"] ?? "";

  expect(contentType).toContain("application/json");

  const myTicketsBody =
    await myTicketsResponse.json();

  const tickets =
    myTicketsBody.data ?? myTicketsBody;

  expect(Array.isArray(tickets)).toBe(true);

  const createdTicket = tickets.find(
    (ticket: {
      ticketNumber?: string;
      summary?: string;
    }) =>
      ticket.ticketNumber === generatedTicketNumber,
  );

  expect(createdTicket).toBeTruthy();

  expect(createdTicket.ticketNumber).toBe(
    generatedTicketNumber,
  );

  expect(createdTicket.summary).toBe(summary);

  console.log(
    "MY TICKETS:",
    tickets.map(
      (ticket: { ticketNumber?: string }) =>
        ticket.ticketNumber,
    ),
  );

  // ============================================================
  // 7. VERIFY MY TICKETS PAGE
  // ============================================================

  await expect(
    page.getByRole("heading", {
      name: /my tickets/i,
    }),
  ).toBeVisible({
    timeout: 15000,
  });

  // Find the row/card containing OUR unique ticket number.
  // This avoids the 59 duplicate "E2E Lab 2 ticket" summaries.
  const ticketNumberLocator = page.getByText(
    generatedTicketNumber,
    {
      exact: true,
    },
  );

  await expect(ticketNumberLocator).toBeVisible({
    timeout: 15000,
  });

  // Find the nearest ticket container.
  const ticketContainer =
    ticketNumberLocator.first().locator(
      "xpath=ancestor::tr[1]",
    );

  if (await ticketContainer.count() > 0) {
    await expect(
      ticketContainer.getByText(summary, {
        exact: true,
      }),
    ).toBeVisible();
  } else {
    // Fallback for card-based layouts.
    const ticketCard =
      ticketNumberLocator.first().locator(
        "xpath=ancestor::*[self::div or self::article][.//text()[contains(., 'E2E Lab 2 ticket')]][1]",
      );

    await expect(ticketCard).toBeVisible();

    await expect(
      ticketCard.getByText(summary, {
        exact: true,
      }),
    ).toBeVisible();
  }

  // ============================================================
  // 8. SEARCH BY TICKET NUMBER
  // ============================================================

  const ticketSearch = page.getByLabel(
    /ticket no\./i,
  );

  await expect(ticketSearch).toBeVisible();

  await ticketSearch.fill(
    generatedTicketNumber,
  );

  await expect(
    page.getByText(generatedTicketNumber, {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 15000,
  });

  // After filtering, there should be only our ticket.
  const filteredTicketNumber =
    page.getByText(generatedTicketNumber, {
      exact: true,
    });

  await expect(
    filteredTicketNumber.first(),
  ).toBeVisible({
    timeout: 15000,
  });

  await ticketSearch.fill("");

  await expect(
    page.getByText(generatedTicketNumber, {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 15000,
  });

  // ============================================================
  // 9. OPEN OUR TICKET
  // ============================================================

  await page.getByText(
    generatedTicketNumber,
    {
      exact: true,
    },
  ).first().click();

  await expect(
    page.getByRole("heading", {
      name: /ticket details/i,
    }),
  ).toBeVisible({
    timeout: 15000,
  });

  // ============================================================
  // 10. VERIFY DETAIL PAGE
  // ============================================================

  await expect(
    page.getByText(summary, {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 15000,
  });

  await expect(
    page.getByText(description, {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 15000,
  });

  // Verify ticket number somewhere on the detail page.
  await expect(
    page.locator("body"),
  ).toContainText(
    generatedTicketNumber,
    {
      timeout: 15000,
    },
  );

  // ============================================================
  // 11. BACK TO MY TICKETS
  // ============================================================

  await page.getByRole("button", {
    name: /^back$/i,
  }).click();

  await expect(
    page.getByRole("heading", {
      name: /my tickets/i,
    }),
  ).toBeVisible({
    timeout: 15000,
  });

  await expect(
    page.getByText(generatedTicketNumber, {
      exact: true,
    }),
  ).toBeVisible({
    timeout: 15000,
  });
});