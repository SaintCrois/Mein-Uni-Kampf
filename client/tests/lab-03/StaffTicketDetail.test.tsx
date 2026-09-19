import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import StaffTicketDetail from "../../src/pages/StaffTicketDetail";
import * as api from "../../src/api";

const ticket: api.TicketDetail = { id: 1, ticketNumber: "TKT-2026-000001", summary: "VPN unavailable", description: "VPN does not connect.", createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z", category: { id: 1, name: "Network" }, relatedSystem: { id: 1, name: "VPN" }, requestedPriority: { id: 1, name: "High" }, itPriority: { id: 1, name: "Medium" }, currentStatus: { id: 1, name: "Open" }, requester: { id: 1, name: "Narin", email: "narin@example.com" }, owner: null, attachments: [] };

afterEach(() => vi.restoreAllMocks());
function mockApi() {
  vi.spyOn(api, "getStaffTicketDetail").mockResolvedValue(ticket);
  vi.spyOn(api, "getStaffAssignees").mockResolvedValue([]);
  vi.spyOn(api, "getPublicComments").mockResolvedValue([]);
  vi.spyOn(api, "getInternalNotes").mockResolvedValue([]);
}

describe("UI-DETAIL-01: Staff Ticket Detail", () => {
  it("renders public comments and visually separate private internal notes", async () => {
    mockApi(); render(<StaffTicketDetail ticketId={1} onBack={vi.fn()} />);
    expect(await screen.findByText("Public Comments")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /internal notes/i })).toBeInTheDocument();
    expect(screen.getByText(/strictly private/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Public comment content")).toBeInTheDocument();
    expect(screen.getByLabelText("Internal note content")).toBeInTheDocument();
  });

  it("validates and posts a private note", async () => {
    mockApi(); const create = vi.spyOn(api, "createInternalNote").mockResolvedValue({ id: 2, content: "Private diagnostic", createdAt: "2026-09-01T00:00:00Z", author: { id: 2, name: "Staff", role: "IT_STAFF" } });
    render(<StaffTicketDetail ticketId={1} onBack={vi.fn()} />);
    const input = await screen.findByLabelText("Internal note content");
    fireEvent.change(input, { target: { value: "Private diagnostic" } });
    fireEvent.click(screen.getByRole("button", { name: /add internal note/i }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(1, "Private diagnostic"));
    expect(screen.getByText("Private diagnostic")).toBeInTheDocument();
  });
});
