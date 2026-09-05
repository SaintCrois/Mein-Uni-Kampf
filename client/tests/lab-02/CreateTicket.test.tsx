import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import CreateTicket from "../../src/pages/CreateTicket";
import { RequesterProvider } from "../../src/context/RequesterContext";
import * as api from "../../src/api";

const requester = {
  id: 1,
  fullName: "Narin Chaiyo",
  email: "narin.chaiyo@example.com",
  isActive: true,
};

function renderCreateTicket() {
  localStorage.setItem("requester", JSON.stringify(requester));

  return render(
    <RequesterProvider>
      <CreateTicket />
    </RequesterProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();

  vi.spyOn(api, "getCategories").mockResolvedValue([
    { id: 1, name: "Account and Access" },
  ]);

  vi.spyOn(api, "getRelatedSystems").mockResolvedValue([
    { id: 1, name: "Email" },
  ]);

  vi.spyOn(api, "getPriorities").mockResolvedValue([
    { id: 1, name: "High" },
  ]);
});

describe("Create Ticket", () => {
  it("shows required-field validation", async () => {
    const user = userEvent.setup();

    renderCreateTicket();

    await screen.findByText("Email");

    await user.click(
      screen.getByRole("button", { name: /(submit|create) ticket/i }),
    );

    expect(
      screen.getByText("Category is required."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Related System is required."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Requested Priority is required."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Summary is required."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Description is required."),
    ).toBeInTheDocument();
  });

  it("creates a ticket and displays the generated ticket number", async () => {
    const user = userEvent.setup();

    vi.spyOn(api, "createTicket").mockResolvedValue({
      id: 123,
      ticketNumber: "TKT-2026-000123",
      requesterId: requester.id,
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Cannot access email",
      requestedPriority: "High",
      description: "Email access is unavailable.",
      currentStatus: "New",
    });

    renderCreateTicket();

    await screen.findByText("Email");

    await user.selectOptions(
      screen.getByLabelText("Category"),
      "1",
    );

    await user.selectOptions(
      screen.getByLabelText("Related System"),
      "1",
    );

    await user.selectOptions(
      screen.getByLabelText("Requested Priority"),
      "1",
    );

    await user.type(
      screen.getByLabelText("Ticket Summary"),
      "Cannot access email",
    );

    await user.type(
      screen.getByLabelText("Description"),
      "Email access is unavailable.",
    );

    await user.click(
      screen.getByRole("button", { name: /(submit|create) ticket/i }),
    );

    expect(
      await screen.findByText("TKT-2026-000123"),
    ).toBeInTheDocument();

    expect(api.createTicket).toHaveBeenCalledTimes(1);
  });

  it("prevents duplicate submissions while creating a ticket", async () => {
    const user = userEvent.setup();

    let resolveTicket!: (
      value: api.CreateTicketResponse,
    ) => void;

    const createPromise =
      new Promise<api.CreateTicketResponse>((resolve) => {
        resolveTicket = resolve;
      });

    vi.spyOn(api, "createTicket").mockReturnValue(createPromise);

    renderCreateTicket();

    await screen.findByText("Email");

    await user.selectOptions(
      screen.getByLabelText("Category"),
      "1",
    );

    await user.selectOptions(
      screen.getByLabelText("Related System"),
      "1",
    );

    await user.selectOptions(
      screen.getByLabelText("Requested Priority"),
      "1",
    );

    await user.type(
      screen.getByLabelText("Ticket Summary"),
      "Duplicate submission test",
    );

    await user.type(
      screen.getByLabelText("Description"),
      "Testing duplicate submission protection.",
    );

    const button = screen.getByRole("button", {
      name: /(submit|create) ticket/i,
    });

    await user.click(button);

    expect(
      screen.getByRole("button", { name: /creating/i }),
    ).toBeDisabled();

    expect(api.createTicket).toHaveBeenCalledTimes(1);

    resolveTicket({
      id: 124,
      ticketNumber: "TKT-2026-000124",
      requesterId: requester.id,
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Duplicate submission test",
      requestedPriority: "High",
      description: "Testing duplicate submission protection.",
      currentStatus: "New",
    });

    expect(
      await screen.findByText("TKT-2026-000124"),
    ).toBeInTheDocument();
  });

  it("shows an error and preserves entered values when creation fails", async () => {
    const user = userEvent.setup();

    vi.spyOn(api, "createTicket").mockRejectedValue(
      new Error("Failed to create ticket."),
    );

    renderCreateTicket();

    await screen.findByText("Email");

    await user.selectOptions(
      screen.getByLabelText("Category"),
      "1",
    );

    await user.selectOptions(
      screen.getByLabelText("Related System"),
      "1",
    );

    await user.selectOptions(
      screen.getByLabelText("Requested Priority"),
      "1",
    );

    const summary = screen.getByLabelText("Ticket Summary");
    const description = screen.getByLabelText("Description");

    await user.type(summary, "Failure test");
    await user.type(
      description,
      "This data should remain.",
    );

    await user.click(
      screen.getByRole("button", { name: /(submit|create) ticket/i }),
    );

    expect(
      await screen.findByText("Failed to create ticket."),
    ).toBeInTheDocument();

    expect(summary).toHaveValue("Failure test");
    expect(description).toHaveValue(
      "This data should remain.",
    );
  });

  it("rejects unsupported attachment types", async () => {
    const user = userEvent.setup();

    renderCreateTicket();

    await screen.findByText("Email");

    const input = screen.getByLabelText("Attachments");

    // Allow the test to upload an otherwise-filtered file.
    input.removeAttribute("accept");

    const file = new File(
      ["not allowed"],
      "malware.txt",
      { type: "text/plain" },
    );

    await user.upload(input, file);

    expect(
      screen.getByText(
        "Only JPG, PNG, WEBP, and PDF files are allowed.",
      ),
    ).toBeInTheDocument();
  });
});