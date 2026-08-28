import { useEffect, useMemo, useState } from "react";
import { getMyTickets, MyTicket } from "../api";
import { useRequester } from "../context/RequesterContext";

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
  const { selectedRequester } = useRequester();

  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [ticketNumberFilter, setTicketNumberFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<"ticketNumber" | "createdAt">(
    "createdAt",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");


    useEffect(() => {
      let cancelled = false;

      async function loadTickets(requesterId: number) {
        setLoading(true);
        setError("");

        try {
          const result = await getMyTickets(requesterId);

          console.log("COMPONENT RECEIVED FROM getMyTickets", {
            requesterId,
            count: result.length,
            ticketNumbers: result.map((ticket) => ticket.ticketNumber),
          });

          if (!cancelled) {
            setTickets(result);
          }
        } catch (error) {
          console.error("FAILED TO LOAD MY TICKETS", error);

          if (!cancelled) {
            setError("Unable to load your tickets.");
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

  const requesterId = selectedRequester?.id;

  if (requesterId == null) {
    setTickets([]);
    return;
  }

  loadTickets(requesterId);

  return () => {
    cancelled = true;
  };
}, [selectedRequester?.id, refreshKey]);


  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          tickets.map((ticket) => [
            ticket.category.id,
            ticket.category.name,
          ]),
        ).entries(),
      ),
    [tickets],
  );

  const priorities = useMemo(
    () =>
      Array.from(
        new Map(
          tickets.map((ticket) => [
            ticket.requestedPriority.id,
            ticket.requestedPriority.name,
          ]),
        ).entries(),
      ),
    [tickets],
  );

  const statuses = useMemo(
    () =>
      Array.from(
        new Map(
          tickets.map((ticket) => [
            ticket.currentStatus.id,
            ticket.currentStatus.name,
          ]),
        ).entries(),
      ),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    const search = ticketNumberFilter.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesTicketNumber =
        !search ||
        ticket.ticketNumber.toLowerCase().includes(search);

      const matchesCategory =
        !categoryFilter ||
        String(ticket.category.id) === categoryFilter;

      const matchesPriority =
        !priorityFilter ||
        String(ticket.requestedPriority.id) === priorityFilter;

      const matchesStatus =
        !statusFilter ||
        String(ticket.currentStatus.id) === statusFilter;

      return (
        matchesTicketNumber &&
        matchesCategory &&
        matchesPriority &&
        matchesStatus
      );
    });
  }, [
    tickets,
    ticketNumberFilter,
    categoryFilter,
    priorityFilter,
    statusFilter,
  ]);

  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      let comparison = 0;

      if (sortField === "ticketNumber") {
        comparison = a.ticketNumber.localeCompare(
          b.ticketNumber,
          undefined,
          { numeric: true },
        );
      } else {
        comparison =
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime();
      }

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });
  }, [filteredTickets, sortField, sortDirection]);


  function handleSort(field: "ticketNumber" | "createdAt") {
    if (sortField === field) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc",
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function clearFilters() {
    setTicketNumberFilter("");
    setCategoryFilter("");
    setPriorityFilter("");
    setStatusFilter("");
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

  if (!selectedRequester) {
    return null;
  }
  console.log("MY TICKETS RENDER", {
    requesterId: selectedRequester.id,
    tickets: tickets.map((ticket) => ticket.ticketNumber),
    filteredTickets: filteredTickets.map((ticket) => ticket.ticketNumber),
    sortedTickets: sortedTickets.map((ticket) => ticket.ticketNumber),
    ticketNumberFilter,
    categoryFilter,
    priorityFilter,
    statusFilter,
  });



  return (
    <section>
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h2 className="h4 mb-1">My Tickets</h2>
          <p className="text-muted mb-0">
            Tickets submitted by {selectedRequester.fullName}
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
              <label
                htmlFor="ticket-number-filter"
                className="form-label fw-semibold"
              >
                Ticket No.
              </label>

              <input
                id="ticket-number-filter"
                type="search"
                className="form-control"
                placeholder="Search ticket number..."
                value={ticketNumberFilter}
                onChange={(event) =>
                  setTicketNumberFilter(event.target.value)
                }
              />
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label
                htmlFor="category-filter"
                className="form-label fw-semibold"
              >
                Category
              </label>

              <select
                id="category-filter"
                className="form-select"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
              >
                <option value="">All Categories</option>

                {categories.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label
                htmlFor="priority-filter"
                className="form-label fw-semibold"
              >
                Requested Priority
              </label>

              <select
                id="priority-filter"
                className="form-select"
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value)
                }
              >
                <option value="">All Priorities</option>

                {priorities.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label
                htmlFor="status-filter"
                className="form-label fw-semibold"
              >
                Current Status
              </label>

              <select
                id="status-filter"
                className="form-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="">All Statuses</option>

                {statuses.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
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
          You have not created any tickets yet.
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h3 className="h6 mb-0">Ticket List</h3>

            <span className="text-muted small">
              Showing {filteredTickets.length} of {tickets.length}
            </span>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="alert alert-secondary">
              No tickets match the selected filters.
            </div>
          ) : (
            <div className="card shadow-sm overflow-hidden">
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
                    {sortedTickets.map((ticket) => (
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
                          {new Date(
                            ticket.createdAt,
                          ).toLocaleDateString()}
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
                            Unassigned
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
