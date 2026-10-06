import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import StaffTicketDetail from "../../src/pages/StaffTicketDetail";
import * as api from "../../src/api";

const ticket = (
  overrides: Partial<api.TicketDetail> = {},
): api.TicketDetail => ({
  id: 1,
  ticketNumber: "TKT-2026-000001",
  summary: "VPN unavailable",
  description: "VPN does not connect.",
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
  category: { id: 1, name: "Network" },
  relatedSystem: { id: 1, name: "VPN" },
  requestedPriority: { id: 1, name: "High" },
  itPriority: { id: 1, name: "Medium" },
  currentStatus: { id: 1, name: "Open" },
  requester: { id: 1, name: "Narin", email: "narin@example.com" },
  owner: null,
  attachments: [],
  requesterResolvedIndicator: false,
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockApi(currentTicket: api.TicketDetail = ticket()) {
  vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue(currentTicket);
  vi.spyOn(api, "getStaffAssignees").mockResolvedValue([]);
  vi.spyOn(api, "getPublicComments").mockResolvedValue([]);
  vi.spyOn(api, "getInternalNotes").mockResolvedValue([]);
  vi.spyOn(api, "getActionsTaken").mockResolvedValue([]);
}

async function renderAndLoad(currentTicket?: api.TicketDetail) {
  mockApi(currentTicket);
  render(<StaffTicketDetail ticketId={1} onBack={vi.fn()} />);
  return screen.findByLabelText(/next status/i);
}

async function statusOptions(): Promise<(string | null)[]> {
  const select = await screen.findByLabelText(/next status/i);
  return within(select)
    .getAllByRole("option")
    .map((option) => (option as HTMLOptionElement).value);
}

describe("UI-WF-01: Status transition selector renders only BR-11 valid next statuses", () => {
  it("Open exposes only In Progress, Waiting for Requester, Resolved, and Cancelled", async () => {
    await renderAndLoad(ticket({ currentStatus: { id: 2, name: "Open" } }));

    const options = await statusOptions();
    expect(options).toContain("In Progress");
    expect(options).toContain("Waiting for Requester");
    expect(options).toContain("Resolved");
    expect(options).toContain("Cancelled");

    expect(options).not.toContain("Open");
    expect(options).not.toContain("New");
    expect(options).not.toContain("Closed");
    expect(options).not.toContain("Reopened");
  });

  it("Waiting for Requester never offers Open (undocumented in BR-11)", async () => {
    await renderAndLoad(
      ticket({ currentStatus: { id: 4, name: "Waiting for Requester" } }),
    );

    const options = await statusOptions();
    expect(options).toContain("In Progress");
    expect(options).toContain("Resolved");
    expect(options).toContain("Cancelled");
    expect(options).not.toContain("Open");
    expect(options).not.toContain("New");
    expect(options).not.toContain("Closed");
  });

  it("Resolved only offers Closed and Reopened (no Cancelled)", async () => {
    await renderAndLoad(
      ticket({ currentStatus: { id: 5, name: "Resolved" } }),
    );

    const options = await statusOptions();
    expect(options).toContain("Closed");
    expect(options).toContain("Reopened");
    expect(options).not.toContain("Cancelled");
    expect(options).not.toContain("Resolved");
    expect(options).not.toContain("Open");
  });

  it("Reopened only offers In Progress, Resolved, and Cancelled (no Open)", async () => {
    await renderAndLoad(
      ticket({ currentStatus: { id: 7, name: "Reopened" } }),
    );

    const options = await statusOptions();
    expect(options).toContain("In Progress");
    expect(options).toContain("Resolved");
    expect(options).toContain("Cancelled");
    expect(options).not.toContain("Open");
    expect(options).not.toContain("Closed");
  });

  it("terminal statuses (Closed/Cancelled) render no transition controls", async () => {
    mockApi(ticket({ currentStatus: { id: 6, name: "Closed" } }));
    render(<StaffTicketDetail ticketId={1} onBack={vi.fn()} />);

    expect(
      await screen.findByText(/terminal status/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/next status/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /update status/i }),
    ).not.toBeInTheDocument();
  });
});

describe("Ticket workflow actions (backend enforced, UI exposed)", () => {
  it("executes a permitted transition and reports success", async () => {
    const select = await renderAndLoad();
    const update = vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
      id: 1,
      ticketNumber: "TKT-2026-000001",
      status: "In Progress",
      updatedAt: "2026-09-01T00:00:10.000Z",
      permittedNextStatuses: [
        "Open",
        "Waiting for Requester",
        "Resolved",
        "Cancelled",
      ],
    });

    fireEvent.change(select, { target: { value: "In Progress" } });
    fireEvent.click(screen.getByRole("button", { name: /update status/i }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        1,
        "In Progress",
        "2026-09-01T00:00:00Z",
      ),
    );
    expect(
      await screen.findByText(/status transitioned to "In Progress"/i),
    ).toBeInTheDocument();
  });

  it("surfaces backend invalid-transition rejections (authoritative enforcement)", async () => {
    const select = await renderAndLoad();
    vi.spyOn(api, "updateTicketStatus").mockRejectedValue(
      new api.ApiError(
        "Invalid status transition from Open to Closed. Permitted transitions: In Progress, Waiting for Requester, Resolved, Cancelled.",
        400,
        "INVALID_STATUS_TRANSITION",
      ),
    );

    fireEvent.change(select, { target: { value: "Resolved" } });
    fireEvent.click(screen.getByRole("button", { name: /update status/i }));

    expect(
      await screen.findByText(/invalid status transition/i),
    ).toBeInTheDocument();
  });

  it("handles stale/conflicting updates safely with a clear conflict message", async () => {
    const select = await renderAndLoad();
    vi.spyOn(api, "updateTicketStatus").mockRejectedValue(
      new api.ApiError(
        "Conflict: Ticket has been modified by another operation",
        409,
        "CONCURRENCY_CONFLICT",
      ),
    );

    fireEvent.change(select, { target: { value: "In Progress" } });
    fireEvent.click(screen.getByRole("button", { name: /update status/i }));

    expect(
      await screen.findByText(/updated by someone else/i),
    ).toBeInTheDocument();
  });

  it("requires confirmation before terminal transitions (Cancelled/Closed)", async () => {
    const select = await renderAndLoad();
    const update = vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
      id: 1,
      ticketNumber: "TKT-2026-000001",
      status: "Cancelled",
      updatedAt: "2026-09-01T00:00:10.000Z",
      permittedNextStatuses: [],
    });

    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.change(select, { target: { value: "Cancelled" } });
    fireEvent.click(screen.getByRole("button", { name: /update status/i }));
    expect(update).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /update status/i }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
  });
});

describe("Resolution behavior: advisory indication vs formal resolution", () => {
  it("shows the advisory banner with an acknowledge action when the requester indicates resolution", async () => {
    await renderAndLoad(
      ticket({
        currentStatus: { id: 2, name: "Open" },
        requesterResolvedIndicator: true,
      }),
    );

    expect(
      await screen.findByText(
        /requester has indicated this problem appears resolved/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/advisory only/i)).toBeInTheDocument();

    const update = vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
      id: 1,
      ticketNumber: "TKT-2026-000001",
      status: "Resolved",
      updatedAt: "2026-09-01T00:00:10.000Z",
      permittedNextStatuses: ["Closed", "Reopened"],
    });

    fireEvent.click(
      screen.getByRole("button", { name: /acknowledge & mark resolved/i }),
    );

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        1,
        "Resolved",
        "2026-09-01T00:00:00Z",
      ),
    );
    expect(
      await screen.findByText(/status transitioned to "Resolved"/i),
    ).toBeInTheDocument();
  });

  it("does not offer Acknowledge when Resolved is not a permitted transition", async () => {
    mockApi(
      ticket({
        currentStatus: { id: 5, name: "Resolved" },
        requesterResolvedIndicator: true,
      }),
    );
    render(<StaffTicketDetail ticketId={1} onBack={vi.fn()} />);

    expect(await screen.findByText(/advisory only/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /acknowledge & mark resolved/i }),
    ).not.toBeInTheDocument();
  });
});

describe("Requester view is read-only (workflow + Actions Taken)", () => {
  it("never renders workflow or Actions Taken create/edit controls to requesters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          ticket({ currentStatus: { id: 5, name: "Resolved" } }),
      }),
    );
    vi.spyOn(api, "getPublicComments").mockResolvedValue([]);
    vi.spyOn(api, "getActionsTaken").mockResolvedValue([
      {
        id: 1,
        ticketId: 1,
        actionDateTime: "2026-09-01T01:00:00Z",
        actionDescription: "Diagnosed issue",
        result: "Found root cause",
        performedBy: { id: 4, name: "Somchai", role: "IT_STAFF" },
        isFollowUpRequired: false,
        followUpNote: null,
        attachmentNotes: null,
        createdAt: "2026-09-01T01:00:00Z",
        updatedAt: "2026-09-01T01:00:00Z",
      },
    ]);

    const TicketDetail = (await import("../../src/pages/TicketDetail")).default;
    render(<TicketDetail ticketId={1} onBack={vi.fn()} />);

    // Advisory indication and formal status are both visible and distinct.
    expect(await screen.findByText(/advisory signal only/i)).toBeInTheDocument();
    expect(screen.getByText("Diagnosed issue")).toBeInTheDocument();

    // No management or workflow controls for requesters.
    expect(
      screen.queryByRole("button", { name: /add action taken/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /update status/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/next status/i)).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});


