import { useEffect, useMemo, useState } from "react";
import { getMyTickets, MyTicket, getCategories, ReferenceItem } from "../api";
import { useAuth } from "../context/AuthContext";

type MyTicketsProps = {
  onOpenTicket: (ticketId: number) => void;
  onCreateTicket: () => void;
  refreshKey?: number;
};

export default function MyTickets({
  onOpenTicket,
  onCreateTicket,
  refreshKey = 0,
}: MyTicketsProps) {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState<ReferenceItem[]>([]);

  // Server-side filters
  const [ticketNumberFilter, setTicketNumberFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<"ticketNumber" | "createdAt">(
    "createdAt",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Client-side filter
  const [categoryFilter, setCategoryFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      if (!user) return;
      
      setLoading(true);
      setError("");

      try {
        const result = await getMyTickets({
          page,
          pageSize,
          search: ticketNumberFilter.trim() || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          sortBy: sortField,
          sortOrder: sortDirection,
        });

        if (!cancelled) {
          setTickets(result.data);
          setTotalItems(result.totalItems);
          setTotalPages(result.totalPages);
        }
      } catch (error) {
        if (!cancelled) {
          setError("Unable to load your tickets.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      cancelled = true;
    };
  }, [
    user,
    refreshKey,
    page,
    pageSize,
    ticketNumberFilter,
    statusFilter,
    priorityFilter,
    sortField,
    sortDirection,
  ]);

  const filteredTickets = useMemo(() => {
    if (!categoryFilter) return tickets;
    return tickets.filter((ticket) => String(ticket.category.id) === categoryFilter);
  }, [tickets, categoryFilter]);

  function handleSort(field: "ticketNumber" | "createdAt") {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1);
  }

  function clearFilters() {
    setTicketNumberFilter("");
    setCategoryFilter("");
    setPriorityFilter("");
    setStatusFilter("");
    setPage(1);
  }

  function getPriorityClass(priority: string) {
    switch (priority.toLowerCase()) {
      case "low":
        return "bg-success-subtle text-success-emphasis border border-success-subtle";
      case "medium":
        return "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
      case "high":
        return "bg-white text-dark border border-danger";
      case "urgent":
        return "bg-danger-subtle text-danger border border-danger-subtle";
      default:
        return "bg-secondary-subtle text-secondary-emphasis border";
    }
  }

  if (!user) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <section>
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h2 className="h4 mb-1">My Tickets</h2>
          <p className="text-muted mb-0">
            Tickets submitted by {user.name}
          </p>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
            <div>
              <h3 className="h6 mb-1">Filter Tickets</h3>
              <p className="text-muted small mb-0">
                Search and filter your submitted tickets.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </button>

              <button
                type="button"
                className="btn btn-success"
                onClick={onCreateTicket}
              >
                + Create New Ticket
              </button>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="ticket-number-filter" className="form-label fw-semibold">
                Search
              </label>
              <input
                id="ticket-number-filter"
                type="search"
                className="form-control"
                placeholder="Search ticket number or summary..."
                value={ticketNumberFilter}
                onChange={(event) => {
                  setTicketNumberFilter(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="category-filter" className="form-label fw-semibold">
                Category
              </label>
              <select
                id="category-filter"
                className="form-select"
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="priority-filter" className="form-label fw-semibold">
                Requested Priority
              </label>
              <select
                id="priority-filter"
                className="form-select"
                value={priorityFilter}
                onChange={(event) => {
                  setPriorityFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="status-filter" className="form-label fw-semibold">
                Current Status
              </label>
              <select
                id="status-filter"
                className="form-select"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting for Requester">Waiting for Requester</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="alert alert-info">
          Loading tickets...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="alert alert-secondary">
          No tickets found.
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h3 className="h6 mb-0">Ticket List</h3>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="alert alert-secondary">
              No tickets match the selected category filter.
            </div>
          ) : (
            <div className="card shadow-sm overflow-hidden mb-3">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">
                        <button
                          type="button"
                          className="btn btn-link p-0 text-dark fw-semibold text-decoration-none"
                          onClick={() => handleSort("ticketNumber")}
                        >
                          Ticket No.{" "}
                          <span className="ms-1">
                            {sortField === "ticketNumber"
                              ? sortDirection === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>

                      <th scope="col">
                        <button
                          type="button"
                          className="btn btn-link p-0 text-dark fw-semibold text-decoration-none"
                          onClick={() => handleSort("createdAt")}
                        >
                          Date{" "}
                          <span className="ms-1">
                            {sortField === "createdAt"
                              ? sortDirection === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>

                      <th scope="col">Summary</th>
                      <th scope="col">Requested Priority</th>
                      <th scope="col">Ticket Owner</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        onClick={() => onOpenTicket(ticket.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <button
                            type="button"
                            className="btn btn-link p-0 fw-bold text-decoration-none"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenTicket(ticket.id);
                            }}
                          >
                            {ticket.ticketNumber}
                          </button>
                        </td>

                        <td className="text-nowrap">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>

                        <td>
                          <div className="fw-semibold">
                            {ticket.summary}
                          </div>
                          <div className="small text-muted">
                            {ticket.category.name}
                            {" · "}
                            {ticket.currentStatus.name}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`badge rounded-pill px-3 py-2 ${getPriorityClass(
                              ticket.requestedPriority.name,
                            )}`}
                          >
                            {ticket.requestedPriority.name}
                          </span>
                        </td>

                        <td>
                          <span className="text-muted">
                            {ticket.owner ? ticket.owner.name : "Unassigned"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-4 pt-3 border-top">
            <span className="text-muted small">
              Showing {startItem} - {endItem} of {totalItems} tickets
            </span>

            <div className="d-flex flex-wrap justify-content-center align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>

              <span className="small px-2">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
