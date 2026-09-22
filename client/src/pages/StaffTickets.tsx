import { useEffect, useState } from "react";
import {
  getCategories,
  getStaffTickets,
  StaffTicket,
  ReferenceItem,
} from "../api";
import { useAuth } from "../context/AuthContext";

type StaffTicketsProps = {
  onOpenTicket: (ticketId: number) => void;
};

export default function StaffTickets({ onOpenTicket }: StaffTicketsProps) {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categories, setCategories] = useState<ReferenceItem[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("");
  const [itPriority, setItPriority] = useState("");
  const [ownership, setOwnership] = useState<"all" | "unassigned" | "mine">("all");

  // Sorting state
  const [sortBy, setSortField] = useState<"createdAt" | "ticketNumber">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const hasActiveFilters = Boolean(
    search.trim() || status || categoryId || requestedPriority || itPriority || ownership !== "all",
  );

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  async function loadTickets() {
    // Client-side role check
    if (user && user.role !== "IT_STAFF" && user.role !== "ADMINISTRATOR") {
      setIsForbidden(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setIsForbidden(false);

      const result = await getStaffTickets({
        search: search.trim() || undefined,
        status: status || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        requestedPriority: requestedPriority || undefined,
        itPriority: itPriority || undefined,
        ownership,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });

      setTickets(result.data ?? result.items ?? []);
      setTotalPages(result.totalPages ?? 1);
      setTotalItems(result.totalItems ?? 0);
    } catch (err: any) {
      const message =
        err instanceof Error ? err.message : "Unable to load staff tickets.";
      if (
        message.toLowerCase().includes("access denied") ||
        message.toLowerCase().includes("forbidden") ||
        message.toLowerCase().includes("403")
      ) {
        setIsForbidden(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, [page, status, categoryId, requestedPriority, itPriority, ownership, sortBy, sortOrder]);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    loadTickets();
  }

  function handleResetFilters() {
    setSearch("");
    setStatus("");
    setCategoryId("");
    setRequestedPriority("");
    setItPriority("");
    setOwnership("all");
    setPage(1);
  }

  function handleSort(field: "createdAt" | "ticketNumber") {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "createdAt" ? "desc" : "asc");
    }
    setPage(1);
  }

  function getStatusBadgeClass(statusName: string) {
    switch (statusName.toLowerCase()) {
      case "new":
        return "badge bg-info text-dark";
      case "open":
        return "badge bg-primary";
      case "in progress":
        return "badge bg-warning text-dark";
      case "waiting for requester":
        return "badge bg-secondary";
      case "resolved":
        return "badge bg-success";
      case "closed":
        return "badge bg-dark";
      case "reopened":
        return "badge bg-danger";
      case "cancelled":
        return "badge bg-light text-muted border";
      default:
        return "badge bg-secondary";
    }
  }

  function getPriorityBadgeClass(priorityName: string) {
    switch (priorityName.toLowerCase()) {
      case "low":
        return "badge bg-success-subtle text-success-emphasis border border-success-subtle";
      case "medium":
        return "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle";
      case "high":
        return "badge bg-white text-dark border border-danger";
      case "urgent":
        return "badge bg-danger text-white";
      default:
        return "badge bg-light text-dark";
    }
  }

  // Pagination display calculation
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  if (isForbidden) {
    return (
      <section className="card shadow-sm border-danger">
        <div className="card-header bg-danger text-white">
          <h2 className="h5 mb-0">Access Forbidden</h2>
        </div>
        <div className="card-body">
          <p className="text-danger mb-0">
            Access Denied: You do not have permission to view the IT Staff Ticket Queue.
            Only authorized IT Staff and Administrators may access this queue.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="card shadow-sm">
      <div className="card-body">
        {/* Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3 pb-2 border-bottom">
          <div>
            <h2 className="h4 mb-1">IT Staff Ticket Queue</h2>
            <p className="text-muted mb-0">
              Manage, search, and monitor tickets across all departments.
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="badge bg-secondary fs-6" aria-label="Ticket count">
              {totalItems} tickets
            </span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={loadTickets}
              disabled={loading}
              aria-label="Refresh ticket queue"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <form onSubmit={handleSearch} className="row g-2 mb-4">
          <div className="col-12 col-md-4">
            <label htmlFor="staff-ticket-search" className="form-label fw-semibold">
              Search
            </label>
            <input
              id="staff-ticket-search"
              className="form-control"
              placeholder="Search by ticket number or summary..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="col-6 col-md-2">
            <label htmlFor="staff-ticket-status" className="form-label fw-semibold">
              Status
            </label>
            <select
              id="staff-ticket-status"
              className="form-select"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
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

          <div className="col-6 col-md-2">
            <label htmlFor="staff-ticket-category" className="form-label fw-semibold">
              Category
            </label>
            <select
              id="staff-ticket-category"
              className="form-select"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label htmlFor="staff-ticket-requested-priority" className="form-label fw-semibold">
              Req. Priority
            </label>
            <select
              id="staff-ticket-requested-priority"
              className="form-select"
              value={requestedPriority}
              onChange={(event) => {
                setRequestedPriority(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All requested</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label htmlFor="staff-ticket-it-priority" className="form-label fw-semibold">
              IT Priority
            </label>
            <select
              id="staff-ticket-it-priority"
              className="form-select"
              value={itPriority}
              onChange={(event) => {
                setItPriority(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All IT priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label htmlFor="staff-ticket-ownership" className="form-label fw-semibold">
              Ownership
            </label>
            <select
              id="staff-ticket-ownership"
              className="form-select"
              value={ownership}
              onChange={(event) => {
                setOwnership(event.target.value as "all" | "unassigned" | "mine");
                setPage(1);
              }}
            >
              <option value="all">All tickets</option>
              <option value="unassigned">Unassigned</option>
              <option value="mine">Assigned to Me</option>
            </select>
          </div>

          <div className="col-12 d-flex gap-2 mt-2">
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleResetFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="alert alert-info d-flex align-items-center gap-2" role="status">
            <div className="spinner-border spinner-border-sm text-info" aria-hidden="true" />
            <span>Loading tickets...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="alert alert-danger d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
            <span className="zen-break-anywhere">{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={loadTickets}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State (Queue has zero tickets total) */}
        {!loading && !error && tickets.length === 0 && !hasActiveFilters && (
          <div className="alert alert-secondary text-center py-4">
            <p className="mb-0 fw-semibold">No tickets in the queue.</p>
          </div>
        )}

        {/* No-Results State (Filters matched zero tickets) */}
        {!loading && !error && tickets.length === 0 && hasActiveFilters && (
          <div className="alert alert-secondary text-center py-4">
            <p className="mb-2">No tickets match the selected filters.</p>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Content: Table for Desktop & Cards for Mobile/Tablet */}
        {!loading && !error && tickets.length > 0 && (
          <>
            {/* Desktop Table View (>= 992px) */}
            <div className="d-none d-lg-block table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th scope="col">
                      <button
                        type="button"
                        className="btn btn-link text-decoration-none text-dark p-0 fw-bold d-flex align-items-center gap-1"
                        onClick={() => handleSort("ticketNumber")}
                      >
                        Ticket No.
                        {sortBy === "ticketNumber" && (
                          <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
                        )}
                      </button>
                    </th>
                    <th scope="col">
                      <button
                        type="button"
                        className="btn btn-link text-decoration-none text-dark p-0 fw-bold d-flex align-items-center gap-1"
                        onClick={() => handleSort("createdAt")}
                      >
                        Created Date
                        {sortBy === "createdAt" && (
                          <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
                        )}
                      </button>
                    </th>
                    <th scope="col">Summary</th>
                    <th scope="col">Category</th>
                    <th scope="col">Requested Priority</th>
                    <th scope="col">IT Priority</th>
                    <th scope="col">Status</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <strong>{ticket.ticketNumber}</strong>
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(ticket.createdAt).toLocaleDateString()}{" "}
                          {new Date(ticket.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </td>
                      <td style={{ maxWidth: "260px" }} className="text-truncate">
                        {ticket.summary}
                      </td>
                      <td>{ticket.category.name}</td>
                      <td>
                        <span
                          className={getPriorityBadgeClass(
                            ticket.requestedPriority.name,
                          )}
                        >
                          {ticket.requestedPriority.name}
                        </span>
                      </td>
                      <td>
                        {ticket.itPriority ? (
                          <span
                            className={getPriorityBadgeClass(
                              ticket.itPriority.name,
                            )}
                          >
                            {ticket.itPriority.name}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={getStatusBadgeClass(
                            ticket.currentStatus.name,
                          )}
                        >
                          {ticket.currentStatus.name}
                        </span>
                      </td>
                      <td>
                        {ticket.owner ? (
                          <span>{ticket.owner.name}</span>
                        ) : (
                          <span className="badge bg-light text-muted border">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          onClick={() => onOpenTicket(ticket.id)}
                        >
                          View Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card View (< 992px) */}
            <div className="d-lg-none d-flex flex-column gap-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="card border shadow-sm">
                  <div className="card-body">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                      <strong className="fs-6 text-primary zen-break-anywhere">
                        {ticket.ticketNumber}
                      </strong>
                      <span
                        className={getStatusBadgeClass(ticket.currentStatus.name)}
                      >
                        {ticket.currentStatus.name}
                      </span>
                    </div>

                    <h5 className="card-title fs-6 mb-2 zen-break-anywhere">{ticket.summary}</h5>

                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <span className="badge bg-light text-dark border">
                        {ticket.category.name}
                      </span>
                      <span
                        className={getPriorityBadgeClass(
                          ticket.requestedPriority.name,
                        )}
                        title="Requested Priority"
                      >
                        Req: {ticket.requestedPriority.name}
                      </span>
                      {ticket.itPriority && (
                        <span
                          className={getPriorityBadgeClass(ticket.itPriority.name)}
                          title="IT Priority"
                        >
                          IT: {ticket.itPriority.name}
                        </span>
                      )}
                    </div>

                    <div className="text-muted small mb-3 zen-break-anywhere">
                      <div>
                        <strong>Requester:</strong> {ticket.requester.name} (
                        {ticket.requester.email})
                      </div>
                      <div>
                        <strong>Owner:</strong>{" "}
                        {ticket.owner ? (
                          ticket.owner.name
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </div>
                      <div>
                        <strong>Created:</strong>{" "}
                        {new Date(ticket.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm w-100"
                      onClick={() => onOpenTicket(ticket.id)}
                    >
                      View Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
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
                  aria-label="Previous page"
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
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
