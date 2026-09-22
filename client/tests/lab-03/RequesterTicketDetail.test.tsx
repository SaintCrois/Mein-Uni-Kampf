import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TicketDetail from "../../src/pages/TicketDetail";
import * as api from "../../src/api";

const ticket = {
  id: 1,
  ticketNumber: "TKT-2026-000001",
  summary: "VPN unavailable",
  description: "VPN does not connect.",
  category: { id: 1, name: "Network" },
  relatedSystem: { id: 1, name: "VPN" },
  requestedPriority: { id: 1, name: "High" },
  currentStatus: { id: 1, name: "Open" },
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
  attachments: [],
};

afterEach(() => vi.restoreAllMocks());

function mockTicketFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ticket,
    }),
  );
}

describe("Requester Ticket Detail public comments", () => {
  it("renders comments visible to the requester and never renders internal notes", async () => {
    mockTicketFetch();
    vi.spyOn(api, "getPublicComments").mockResolvedValue([
      {
        id: 1,
        content: "The VPN maintenance is complete.",
        createdAt: "2026-09-01T10:00:00Z",
        author: { id: 2, name: "IT Staff", role: "IT_STAFF" },
      },
    ]);

    render(<TicketDetail ticketId={1} onBack={vi.fn()} />);

    expect(await screen.findByText("Public Comments")).toBeInTheDocument();
    expect(screen.getByText("The VPN maintenance is complete.")).toBeInTheDocument();
    expect(screen.getByText(/visible to requester and staff/i)).toBeInTheDocument();
    expect(screen.queryByText(/internal notes/i)).not.toBeInTheDocument();
  });

  it("renders an empty state when no public comments exist", async () => {
    mockTicketFetch();
    vi.spyOn(api, "getPublicComments").mockResolvedValue([]);

    render(<TicketDetail ticketId={1} onBack={vi.fn()} />);

    expect(await screen.findByText("No public comments yet.")).toBeInTheDocument();
  });

  it("shows a comment loading failure without hiding ticket details", async () => {
    mockTicketFetch();
    vi.spyOn(api, "getPublicComments").mockRejectedValue(
      new Error("Failed to fetch public comments."),
    );

    render(<TicketDetail ticketId={1} onBack={vi.fn()} />);

    expect(await screen.findByText("Failed to fetch public comments.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("VPN unavailable")).toBeInTheDocument();
  });

  it("validates and posts a public comment", async () => {
    mockTicketFetch();
    vi.spyOn(api, "getPublicComments").mockResolvedValue([]);
    const create = vi.spyOn(api, "createPublicComment").mockResolvedValue({
      id: 2,
      content: "I can connect again now.",
      createdAt: "2026-09-01T11:00:00Z",
      author: { id: 1, name: "Requester", role: "REQUESTER" },
    });

    render(<TicketDetail ticketId={1} onBack={vi.fn()} />);
    const input = await screen.findByLabelText("Public comment content");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /post public comment/i }));
    expect(screen.getByText(/cannot be empty or whitespace-only/i)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "I can connect again now." } });
    fireEvent.click(screen.getByRole("button", { name: /post public comment/i }));

    await waitFor(() => expect(create).toHaveBeenCalledWith(1, "I can connect again now."));
    expect(screen.getByText("I can connect again now.")).toBeInTheDocument();
  });
});
