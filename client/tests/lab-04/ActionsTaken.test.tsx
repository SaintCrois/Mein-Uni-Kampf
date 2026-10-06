import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ActionsTaken from "../../src/components/ActionsTaken";
import * as api from "../../src/api";

const action = (overrides: Partial<api.ActionTaken> = {}): api.ActionTaken => ({
  id: 1,
  ticketId: 105,
  actionDateTime: "2026-09-24T14:30:00.000Z",
  actionDescription: "Replaced faulty RAM module in slot 2.",
  result: "Diagnostics passed with zero errors.",
  performedBy: { id: 4, name: "Somchai Jaidee", role: "IT_STAFF" },
  isFollowUpRequired: false,
  followUpNote: null,
  attachmentNotes: null,
  createdAt: "2026-09-24T14:35:00.000Z",
  updatedAt: "2026-09-24T14:35:00.000Z",
  ...overrides,
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockList(actions: api.ActionTaken[]) {
  return vi.spyOn(api, "getActionsTaken").mockResolvedValue(actions);
}

function openModal(name: RegExp) {
  return fireEvent.click(screen.getByRole("button", { name }));
}

describe("UI-ACT-01: Actions Taken create form validation & conditional follow-up", () => {
  it("validates required fields and the conditional follow-up note before submitting", async () => {
    mockList([]);
    const create = vi.spyOn(api, "createActionTaken").mockImplementation(
      async (ticketId, input) =>
        action({
          id: 99,
          ticketId,
          actionDescription: input.actionDescription,
          result: input.result,
          actionDateTime: input.actionDateTime ?? new Date().toISOString(),
          isFollowUpRequired: input.isFollowUpRequired ?? false,
          followUpNote: input.followUpNote ?? null,
        }),
    );

    render(<ActionsTaken ticketId={1} canManage />);
    expect(
      await screen.findByRole("button", { name: /add action taken/i }),
    ).toBeInTheDocument();

    openModal(/add action taken/i);

    // Follow-up note is hidden until follow-up is flagged.
    expect(screen.queryByLabelText(/follow-up note/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create Action Taken" }));
    expect(
      await screen.findByText("Action description is required."),
    ).toBeInTheDocument();
    expect(screen.getByText("Result is required.")).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();

    // Conditional note: flagging follow-up reveals a mandatory note field.
    fireEvent.click(screen.getByLabelText(/follow-up required/i));
    expect(screen.getByLabelText(/follow-up note/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/action description/i), {
      target: { value: "Checked disk health" },
    });
    fireEvent.change(screen.getByLabelText(/^result/i), {
      target: { value: "SMART status healthy." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Action Taken" }));
    expect(await screen.findByText(/follow-up note is required/i)).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/follow-up note/i), {
      target: { value: "Re-check in 7 days" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Action Taken" }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          actionDescription: "Checked disk health",
          result: "SMART status healthy.",
          isFollowUpRequired: true,
          followUpNote: "Re-check in 7 days",
        }),
      ),
    );
    expect(
      await screen.findByText(/action taken recorded successfully/i),
    ).toBeInTheDocument();
  });
});

describe("Actions Taken display, ordering, and states", () => {
  it("shows a loading state, then renders multiple actions in stable chronological order with all fields", async () => {
    mockList([
      action({
        id: 3,
        actionDateTime: "2026-09-24T14:30:00.000Z",
        actionDescription: "Later action",
        result: "Later result",
        isFollowUpRequired: true,
        followUpNote: "Inspect again next week",
        attachmentNotes: "diagnostics.pdf",
      }),
      action({
        id: 1,
        actionDateTime: "2026-09-20T09:00:00.000Z",
        actionDescription: "First action",
        result: "First result",
        performedBy: { id: 5, name: "Anong Prasert", role: "ADMINISTRATOR" },
      }),
      action({
        id: 2,
        actionDateTime: "2026-09-22T11:00:00.000Z",
        actionDescription: "Middle action",
        result: "Middle result",
      }),
    ]);

    render(<ActionsTaken ticketId={1} canManage />);
    expect(screen.getByText(/loading actions taken/i)).toBeInTheDocument();

    const items = await screen.findAllByTestId("action-taken-item");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("First action");
    expect(items[1]).toHaveTextContent("Middle action");
    expect(items[2]).toHaveTextContent("Later action");

    // Displayed fields: date/time, description, result, performer, follow-up,
    // attachment notes.
    expect(items[0]).toHaveTextContent("Anong Prasert");
    expect(items[0]).toHaveTextContent("Admin");
    expect(items[2]).toHaveTextContent("Follow-Up Required");
    expect(items[2]).toHaveTextContent("Inspect again next week");
    expect(items[2]).toHaveTextContent("diagnostics.pdf");
  });

  it("renders a friendly empty state when the ticket has no actions", async () => {
    mockList([]);
    render(<ActionsTaken ticketId={1} canManage />);
    expect(
      await screen.findByText(/no actions taken have been recorded/i),
    ).toBeInTheDocument();
  });

  it("renders an error state with retry that recovers on the next load", async () => {
    vi.spyOn(api, "getActionsTaken")
      .mockRejectedValueOnce(new Error("Failed to fetch actions taken."))
      .mockResolvedValueOnce([]);

    render(<ActionsTaken ticketId={1} canManage />);
    expect(
      await screen.findByText("Failed to fetch actions taken."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(
      await screen.findByText(/no actions taken have been recorded/i),
    ).toBeInTheDocument();
  });

  it("renders a forbidden state for users without view permission and hides management controls", async () => {
    vi.spyOn(api, "getActionsTaken").mockRejectedValue(
      new api.ApiError("Access denied", 403, "ACCESS_DENIED"),
    );

    render(<ActionsTaken ticketId={1} canManage />);
    expect(
      await screen.findByText(/permission to view actions taken/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add action taken/i }),
    ).not.toBeInTheDocument();
  });
});

describe("UI-ACT-02: Requester read-only access and staff permissions", () => {
  it("hides Add/Edit controls for read-only users while still listing actions and allowing View", async () => {
    mockList([
      action({
        isFollowUpRequired: true,
        followUpNote: "Call the user back",
        attachmentNotes: "memtest-results.pdf",
      }),
    ]);

    render(<ActionsTaken ticketId={1} canManage={false} />);

    const items = await screen.findAllByTestId("action-taken-item");
    expect(items).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: /add action taken/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();

    // View remains available and shows the full record.
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Action Taken Details")).toBeInTheDocument();
    expect(within(dialog).getByText("Call the user back")).toBeInTheDocument();
    expect(within(dialog).getByText("memtest-results.pdf")).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: /edit action taken/i }),
    ).toBeNull();
  });

  it("allows IT Staff/Administrators to edit an action with pre-filled values and optimistic locking", async () => {
    const existing = action({ id: 7, updatedAt: "2026-09-24T14:35:00.000Z" });
    mockList([existing]);

    const update = vi
      .spyOn(api, "updateActionTaken")
      .mockResolvedValue(action({ id: 7, result: "Updated result" }));

    render(<ActionsTaken ticketId={1} canManage />);
    const items = await screen.findAllByTestId("action-taken-item");
    expect(items[0]).toHaveTextContent("Replaced faulty RAM module in slot 2.");

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText(/action description/i)).toHaveValue(
      "Replaced faulty RAM module in slot 2.",
    );
    expect(screen.getByLabelText(/^result/i)).toHaveValue(
      "Diagnostics passed with zero errors.",
    );

    fireEvent.change(screen.getByLabelText(/^result/i), {
      target: { value: "Updated result" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        1,
        7,
        expect.objectContaining({ result: "Updated result" }),
        "2026-09-24T14:35:00.000Z",
      ),
    );
    expect(
      await screen.findByText(/action taken updated successfully/i),
    ).toBeInTheDocument();
  });
});

describe("Conflict and stale update handling", () => {
  it("surfaces a conflict message when an Action Taken was modified concurrently", async () => {
    const existing = action({ id: 4 });
    mockList([existing]);
    const update = vi.spyOn(api, "updateActionTaken").mockRejectedValue(
      new api.ApiError(
        "Conflict: Ticket has been modified by another operation",
        409,
        "CONCURRENCY_CONFLICT",
      ),
    );

    render(<ActionsTaken ticketId={1} canManage />);
    await screen.findAllByTestId("action-taken-item");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    fireEvent.change(screen.getByLabelText(/^result/i), {
      target: { value: "Racing result" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByText(/modified by another operation/i)).toBeInTheDocument();
    // Entered data is preserved while the conflict is reported.
    expect(screen.getByLabelText(/^result/i)).toHaveValue("Racing result");
    expect(update).toHaveBeenCalledTimes(1);
  });
});


