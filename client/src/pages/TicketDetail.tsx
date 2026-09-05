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

  const loadTicket = async () => {
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
  };

  useEffect(() => {
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
            <label htmlFor="detail-ticket-number" className="form-label fw-semibold">
                Ticket Number
            </label>

            <input
                id="detail-ticket-number"
                type="text"
                className="form-control"
                value={ticket.ticketNumber}
                readOnly
            />
            </div>

            {/* Basic Information */}
            <div className="row g-3 mb-4">

            <div className="col-12 col-md-6">
                <label htmlFor="detail-category" className="form-label fw-semibold">
                Category
                </label>

                <input
                id="detail-category"
                type="text"
                className="form-control"
                value={ticket.category.name}
                readOnly
                />
            </div>

            <div className="col-12 col-md-6">
                <label htmlFor="detail-related-system" className="form-label fw-semibold">
                Related System
                </label>

                <input
                id="detail-related-system"
                type="text"
                className="form-control"
                value={ticket.relatedSystem.name}
                readOnly
                />
            </div>

            <div className="col-12 col-md-6">
                <label htmlFor="detail-priority" className="form-label fw-semibold">
                Requested Priority
                </label>

                <input
                    id="detail-priority"
                    type="text"
                    className={`form-control ${getPriorityClass(
                        ticket.requestedPriority.name,
                    )}`}
                    value={ticket.requestedPriority.name}
                    readOnly
                />

            </div>

            <div className="col-12 col-md-6">
                <label htmlFor="detail-status" className="form-label fw-semibold">
                Current Status
                </label>

                <input
                id="detail-status"
                type="text"
                className="form-control"
                value={ticket.currentStatus.name}
                readOnly
                />
            </div>

            <div className="col-12 col-md-6">
                <label htmlFor="detail-created" className="form-label fw-semibold">
                Created
                </label>

                <input
                id="detail-created"
                type="text"
                className="form-control"
                value={new Date(
                    ticket.createdAt,
                ).toLocaleString()}
                readOnly
                />
            </div>

            <div className="col-12 col-md-6">
                <label htmlFor="detail-updated" className="form-label fw-semibold">
                Last Updated
                </label>

                <input
                id="detail-updated"
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
            <label htmlFor="detail-summary" className="form-label fw-semibold">
                Summary
            </label>

            <input
                id="detail-summary"
                type="text"
                className="form-control"
                value={ticket.summary}
                readOnly
            />
            </div>

            {/* Description */}
            <div className="mb-4">
            <label htmlFor="detail-description" className="form-label fw-semibold">
                Description
            </label>

            <textarea
                id="detail-description"
                className="form-control"
                rows={7}
                value={ticket.description}
                readOnly
            />
            </div>

            {/* Attachments */}
            <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0">
                Attachments
                </label>
            </div>

            {/* Add Attachment Control */}
            <div className="input-group mb-3">
                <input
                type="file"
                className="form-control"
                id="add-attachment-input"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const requesterId = selectedRequester?.id;
                    if (!requesterId) return;

                    try {
                    setError("");
                    const formData = new FormData();
                    formData.append("files", file);

                    const res = await fetch(`${API_URL}/api/tickets/${ticket.id}/attachments`, {
                        method: "POST",
                        headers: {
                        "X-Requester-Id": String(requesterId),
                        },
                        body: formData,
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => null);
                        throw new Error(errData?.error || "Failed to upload attachment.");
                    }

                    // Reload ticket details
                    loadTicket();
                    e.target.value = "";
                    } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to upload attachment.");
                    }
                }}
                />
            </div>

            {ticket.attachments.length === 0 ? (
                <div className="border rounded p-3 text-muted">
                No attachments.
                </div>
            ) : (
                <div className="list-group">
                {ticket.attachments.map((attachment) => (
                    <div
                    key={attachment.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                    >
                    <div>
                        <span className="fw-medium me-2">{attachment.originalFileName}</span>
                        <span className="badge bg-secondary me-2">{(attachment.fileSize / 1024).toFixed(1)} KB</span>
                        {attachment.status === "REMOVED" && (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                            Removed: {attachment.removalReason || "No reason specified"}
                        </span>
                        )}
                    </div>

                    <div className="d-flex gap-2">
                        {attachment.status === "ACTIVE" ? (
                        <>
                            <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={async () => {
                                const requesterId = selectedRequester?.id;
                                if (!requesterId) return;

                                try {
                                const response = await fetch(
                                    `${API_URL}/api/tickets/${ticket.id}/attachments/${attachment.id}/download`,
                                    {
                                    headers: {
                                        "X-Requester-Id": String(requesterId),
                                    },
                                    },
                                );

                                if (!response.ok) {
                                    const data = await response.json().catch(() => null);
                                    throw new Error(data?.error || "Failed to download attachment.");
                                }

                                const blob = await response.blob();
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = attachment.originalFileName;
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                URL.revokeObjectURL(url);
                                } catch (err) {
                                setError(err instanceof Error ? err.message : "Failed to download attachment.");
                                }
                            }}
                            >
                            Download
                            </button>

                            <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={async () => {
                                const reason = window.prompt("Please enter a removal reason:");
                                if (!reason || !reason.trim()) return;

                                const requesterId = selectedRequester?.id;
                                if (!requesterId) return;

                                try {
                                const res = await fetch(
                                    `${API_URL}/api/tickets/${ticket.id}/attachments/${attachment.id}`,
                                    {
                                    method: "DELETE",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "X-Requester-Id": String(requesterId),
                                    },
                                    body: JSON.stringify({ reason: reason.trim() }),
                                    },
                                );

                                if (!res.ok) {
                                    const errData = await res.json().catch(() => null);
                                    throw new Error(errData?.error || "Failed to remove attachment.");
                                }

                                loadTicket();
                                } catch (err) {
                                setError(err instanceof Error ? err.message : "Failed to remove attachment.");
                                }
                            }}
                            >
                            Remove
                            </button>
                        </>
                        ) : (
                        <span className="text-muted small">Download Blocked (Removed)</span>
                        )}
                    </div>
                    </div>
                ))}
                </div>
            )}
            </div>
        </div>
        </div>
    </section>
    );

}
