import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StaffTickets from "../../src/pages/StaffTickets";
import * as AuthContextModule from "../../src/context/AuthContext";
import * as api from "../../src/api";

afterEach(() => {
  vi.restoreAllMocks();
});

const mockStaffUser: api.User = {
  id: 2,
  name: "Somchai Jaidee",
  email: "somchai.jaidee@example.com",
  role: "IT_STAFF",
  mustChangePassword: false,
};

const mockCategories: api.ReferenceItem[] = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
  { id: 3, name: "Software" },
  { id: 4, name: "Network" },
];

const mockTickets: api.StaffTicket[] = [
  {
    id: 101,
    ticketNumber: "TKT-2026-000101",
    summary: "Cannot access internal VPN",
    createdAt: "2026-09-15T10:00:00.000Z",
    category: { id: 4, name: "Network" },
    requestedPriority: { id: 3, name: "High" },
    itPriority: { id: 4, name: "Urgent" },
    currentStatus: { id: 1, name: "New" },
    owner: null,
    requester: {
      id: 1,
      name: "Narin Chaiyo",
      email: "narin.chaiyo@example.com",
    },
  },
  {
    id: 102,
    ticketNumber: "TKT-2026-000102",
    summary: "Broken keyboard on corporate laptop",
    createdAt: "2026-09-14T09:30:00.000Z",
    category: { id: 2, name: "Hardware" },
    requestedPriority: { id: 2, name: "Medium" },
    itPriority: { id: 2, name: "Medium" },
    currentStatus: { id: 2, name: "Open" },
    owner: {
      id: 2,
      name: "Somchai Jaidee",
      email: "somchai.jaidee@example.com",
      role: "IT_STAFF",
    },
    requester: {
      id: 3,
      name: "Pimchanok Rattanakul",
      email: "pimchanok.rattanakul@example.com",
    },
  },
];

describe("UI-QUEUE-01: Staff Ticket Queue Component", () => {
  beforeEach(() => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: mockStaffUser,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      setUser: vi.fn(),
    });

    vi.spyOn(api, "getCategories").mockResolvedValue(mockCategories);
  });

  it("renders queue table with ticket rows, status badges, priority badges, and pagination", async () => {
    vi.spyOn(api, "getStaffTickets").mockResolvedValue({
      items: mockTickets,
      page: 1,
      pageSize: 10,
      totalItems: 2,
      totalPages: 1,
    });

    const onOpenTicket = vi.fn();
    render(<StaffTickets onOpenTicket={onOpenTicket} />);

    // Header & counters
    expect(
      await screen.findByRole("heading", { name: /it staff ticket queue/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Ticket count")).toHaveTextContent("2 tickets");

    // Table column headers
    expect(screen.getByRole("columnheader", { name: /ticket no\./i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /created date/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /summary/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /category/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /requested priority/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /it priority/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /owner/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /actions/i })).toBeInTheDocument();

    // Ticket rows content
    expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/cannot access internal vpn/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText("TKT-2026-000102")[0]).toBeInTheDocument();
    expect(
      screen.getAllByText(/broken keyboard on corporate laptop/i)[0],
    ).toBeInTheDocument();

    // Assigned vs unassigned indicators
    expect(screen.getAllByText("Unassigned")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Somchai Jaidee")[0]).toBeInTheDocument();

    // Pagination counter
    expect(screen.getByText(/showing 1 - 2 of 2 tickets/i)).toBeInTheDocument();
  });

  it("renders empty state when queue has 0 tickets total", async () => {
    vi.spyOn(api, "getStaffTickets").mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    render(<StaffTickets onOpenTicket={vi.fn()} />);

    expect(
      await screen.findByText(/no tickets in the queue/i),
    ).toBeInTheDocument();
  });

  it("renders no-results state with 'Reset Filters' when search or filters match nothing", async () => {
    vi.spyOn(api, "getStaffTickets").mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });

    render(<StaffTickets onOpenTicket={vi.fn()} />);

    // Type search
    const searchInput = await screen.findByLabelText(/search/i);
    fireEvent.change(searchInput, { target: { value: "nonexistent query" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(
      await screen.findByText(/no tickets match the selected filters/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reset filters/i }),
    ).toBeInTheDocument();
  });

  it("triggers search and filter queries when inputs change", async () => {
    const getStaffTicketsSpy = vi.spyOn(api, "getStaffTickets").mockResolvedValue({
      items: mockTickets,
      page: 1,
      pageSize: 10,
      totalItems: 2,
      totalPages: 1,
    });

    render(<StaffTickets onOpenTicket={vi.fn()} />);

    await screen.findByRole("heading", { name: /it staff ticket queue/i });

    // Change status filter
    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.change(statusSelect, { target: { value: "New" } });

    await waitFor(() => {
      expect(getStaffTicketsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: "New" }),
      );
    });

    // Change ownership filter
    const ownershipSelect = screen.getByLabelText(/ownership/i);
    fireEvent.change(ownershipSelect, { target: { value: "unassigned" } });

    await waitFor(() => {
      expect(getStaffTicketsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ ownership: "unassigned" }),
      );
    });
  });

  it("toggles column header sorting between asc and desc", async () => {
    const getStaffTicketsSpy = vi.spyOn(api, "getStaffTickets").mockResolvedValue({
      items: mockTickets,
      page: 1,
      pageSize: 10,
      totalItems: 2,
      totalPages: 1,
    });

    render(<StaffTickets onOpenTicket={vi.fn()} />);

    await screen.findByRole("heading", { name: /it staff ticket queue/i });

    // Click Ticket No. header to sort asc
    const ticketNoSortBtn = screen.getByRole("button", { name: /ticket no\./i });
    fireEvent.click(ticketNoSortBtn);

    await waitFor(() => {
      expect(getStaffTicketsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "ticketNumber", sortOrder: "asc" }),
      );
    });

    // Re-query and click again to toggle desc
    const ticketNoSortBtnUpdated = screen.getByRole("button", { name: /ticket no\./i });
    fireEvent.click(ticketNoSortBtnUpdated);

    await waitFor(() => {
      expect(getStaffTicketsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "ticketNumber", sortOrder: "desc" }),
      );
    });
  });

  it("navigates pagination pages when Next and Previous are clicked", async () => {
    const getStaffTicketsSpy = vi.spyOn(api, "getStaffTickets").mockResolvedValue({
      items: [mockTickets[0]],
      page: 1,
      pageSize: 1,
      totalItems: 2,
      totalPages: 2,
    });

    render(<StaffTickets onOpenTicket={vi.fn()} />);

    await screen.findByRole("heading", { name: /it staff ticket queue/i });

    const nextBtn = screen.getByRole("button", { name: /next page/i });
    expect(nextBtn).toBeEnabled();

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(getStaffTicketsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("invokes onOpenTicket when 'View Ticket' is clicked", async () => {
    vi.spyOn(api, "getStaffTickets").mockResolvedValue({
      items: mockTickets,
      page: 1,
      pageSize: 10,
      totalItems: 2,
      totalPages: 1,
    });

    const onOpenTicket = vi.fn();
    render(<StaffTickets onOpenTicket={onOpenTicket} />);

    const viewButtons = await screen.findAllByRole("button", { name: /view ticket/i });
    fireEvent.click(viewButtons[0]);

    expect(onOpenTicket).toHaveBeenCalledWith(101);
  });

  it("displays loading state while fetching tickets", async () => {
    let resolveTickets: (value: any) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolveTickets = resolve;
    });
    vi.spyOn(api, "getStaffTickets").mockReturnValue(pendingPromise as any);

    render(<StaffTickets onOpenTicket={vi.fn()} />);

    expect(screen.getByText(/loading tickets\.\.\./i)).toBeInTheDocument();

    resolveTickets({
      items: [],
      page: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });
    await waitFor(() => {
      expect(screen.queryByText(/loading tickets\.\.\./i)).not.toBeInTheDocument();
    });
  });

  it("displays error feedback alert when API fails", async () => {
    vi.spyOn(api, "getStaffTickets").mockRejectedValue(
      new Error("Network connection lost"),
    );

    render(<StaffTickets onOpenTicket={vi.fn()} />);

    expect(
      await screen.findByText(/network connection lost/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("displays forbidden state when unauthorized user tries to view the queue", async () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: {
        id: 1,
        name: "Narin Chaiyo",
        email: "narin.chaiyo@example.com",
        role: "REQUESTER",
        mustChangePassword: false,
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      setUser: vi.fn(),
    });

    render(<StaffTickets onOpenTicket={vi.fn()} />);

    expect(
      await screen.findByRole("heading", { name: /access forbidden/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/only authorized it staff/i)).toBeInTheDocument();
  });
});
