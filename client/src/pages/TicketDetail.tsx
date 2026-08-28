import { useEffect, useState } from "react";
import { useRequester } from "../context/RequesterContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface TicketDetailData {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  category: {
    id: number;
    name: string;
  };
  relatedSystem: {
    id: number;
    name: string;
  };
  requestedPriority: {
    id: number;
    name: string;
  };
  currentStatus: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  attachments: {
    id: number;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    status: string;
    removalReason: string | null;
    removedAt: string | null;
    uploadedAt: string;
  }[];
}

interface TicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export default function TicketDetail({
  ticketId,
  onBack,
}: TicketDetailProps) {
    const { selectedRequester } = useRequester();
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTicket() {
      try {
        setLoading(true);
        setError("");

        const requesterId = selectedRequester?.id;

        if (!requesterId) {
        throw new Error("Requester context is required.");
        }


        const response = await fetch(
          `${API_URL}/api/tickets/${ticketId}`,
          {
            headers: {
                "X-Requester-Id": String(requesterId),
            },
          },
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data?.error || "Failed to fetch ticket.",
          );
        }

        const data = await response.json();
        setTicket(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch ticket.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
    }, [ticketId, selectedRequester?.id]);

    function getPriorityClass(priority: string) {
        switch (priority.toLowerCase()) {
            case "low":
            return "priority-low";

            case "medium":
            return "priority-medium";

            case "high":
            return "priority-high";

            case "urgent":
            return "priority-urgent";

            default:
            return "";
        }
    }


  if (loading) {
    return (
      <main>
        <button onClick={onBack}>Back</button>
        <p>Loading ticket...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <button onClick={onBack}>Back</button>
        <p>{error}</p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main>
        <button onClick={onBack}>Back</button>
        <p>Ticket not found.</p>
      </main>
    );
  }

  return (
    <section>
        <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 className="h4 mb-1">Ticket Details</h2>
            <p className="text-muted mb-0">
            View details of your submitted ticket.
            </p>
        </div>

        <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onBack}
        >
            ← Back to My Tickets
        </button>
        </div>

        <div className="card shadow-sm">
        <div className="card-body p-4">

            {/* Ticket Number */}
            <div className="mb-4">
            <label className="form-label fw-semibold">
                Ticket Number
            </label>

            <input
                type="text"
                className="form-control"
                value={ticket.ticketNumber}
                readOnly
            />
            </div>

            {/* Basic Information */}
            <div className="row g-3 mb-4">

            <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">
                Category
                </label>

                <input
                type="text"
                className="form-control"
                value={ticket.category.name}
                readOnly
                />
            </div>

            <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">
                Related System
                </label>

                <input
                type="text"
                className="form-control"
                value={ticket.relatedSystem.name}
                readOnly
                />
            </div>

            <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">
                Requested Priority
                </label>

                <input
                    type="text"
                    className={`form-control ${getPriorityClass(
                        ticket.requestedPriority.name,
                    )}`}
                    value={ticket.requestedPriority.name}
                    readOnly
                />

            </div>

            <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">
                Current Status
                </label>

                <input
                type="text"
                className="form-control"
                value={ticket.currentStatus.name}
                readOnly
                />
            </div>

            <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">
                Created
                </label>

                <input
                type="text"
                className="form-control"
                value={new Date(
                    ticket.createdAt,
                ).toLocaleString()}
                readOnly
                />
            </div>

            <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">
                Last Updated
                </label>

                <input
                type="text"
                className="form-control"
                value={new Date(
                    ticket.updatedAt,
                ).toLocaleString()}
                readOnly
                />
            </div>
            </div>

            {/* Summary */}
            <div className="mb-4">
            <label className="form-label fw-semibold">
                Summary
            </label>

            <input
                type="text"
                className="form-control"
                value={ticket.summary}
                readOnly
            />
            </div>

            {/* Description */}
            <div className="mb-4">
            <label className="form-label fw-semibold">
                Description
            </label>

            <textarea
                className="form-control"
                rows={7}
                value={ticket.description}
                readOnly
            />
            </div>

            {/* Attachments */}
            <div>
            <label className="form-label fw-semibold">
                Attachments
            </label>

            {ticket.attachments.length === 0 ? (
                <div className="border rounded p-3 text-muted">
                No attachments.
                </div>
            ) : (
                <div className="list-group">
                {ticket.attachments.map((attachment) => (
                    <button
                    key={attachment.id}
                    type="button"
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    onClick={async () => {
                        const requesterId =
                        selectedRequester?.id;

                        if (!requesterId) {
                        setError(
                            "Requester context is required.",
                        );
                        return;
                        }

                        try {
                        const response = await fetch(
                            `${API_URL}/api/tickets/${ticket.id}/attachments/${attachment.id}/download`,
                            {
                            headers: {
                                "X-Requester-Id":
                                String(requesterId),
                            },
                            },
                        );

                        if (!response.ok) {
                            const data =
                            await response
                                .json()
                                .catch(() => null);

                            throw new Error(
                            data?.error ||
                                "Failed to download attachment.",
                            );
                        }

                        const blob =
                            await response.blob();

                        const url =
                            URL.createObjectURL(blob);

                        const link =
                            document.createElement("a");

                        link.href = url;
                        link.download =
                            attachment.originalFileName;

                        document.body.appendChild(link);
                        link.click();
                        link.remove();

                        URL.revokeObjectURL(url);
                        } catch (err) {
                        setError(
                            err instanceof Error
                            ? err.message
                            : "Failed to download attachment.",
                        );
                        }
                    }}
                    >
                    <span>
                        {attachment.originalFileName}
                    </span>

                    <span className="text-success">
                        Download
                    </span>
                    </button>
                ))}
                </div>
            )}
            </div>
        </div>
        </div>
    </section>
    );

}
