import { useEffect, useState } from "react";
import { useRequester } from "../context/RequesterContext";
import { getMyTickets } from "../api";

type Ticket = {
  id: number;
  ticketNumber: string;
  summary: string;
  status: string;
  createdAt?: string;
};

type MyTicketsProps = {
  onOpenTicket: (ticketId: number) => void;
};

export default function MyTickets({
  onOpenTicket,
}: MyTicketsProps) {
  const { selectedRequester } = useRequester();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTickets() {
      if (!selectedRequester) {
        setTickets([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await getMyTickets(
          selectedRequester.id,
        );

        setTickets(result);
      } catch {
        setError("Unable to load your tickets.");
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [selectedRequester]);

  if (!selectedRequester) {
    return null;
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="h4 mb-1">My Tickets</h2>
          <p className="text-muted mb-0">
            Tickets submitted by {selectedRequester.fullName}
          </p>
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
        <div className="list-group">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              className="list-group-item list-group-item-action"
              onClick={() => onOpenTicket(ticket.id)}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="me-3">
                  <div className="fw-bold">
                    {ticket.ticketNumber}
                  </div>

                  <div>{ticket.summary}</div>
                </div>

                <span className="badge bg-secondary">
                  {ticket.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
