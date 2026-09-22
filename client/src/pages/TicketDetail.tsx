import { useEffect, useState, type FormEvent } from "react";
import {
  createPublicComment,
  getPublicComments,
  markResolvedIndicator,
  type PublicComment,
} from "../api";

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
  requesterResolvedIndicator?: boolean;
}

interface TicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export default function TicketDetail({
  ticketId,
  onBack,
}: TicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentError, setCommentError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  const handleToggleResolved = async () => {
    if (!ticket) return;
    const nextState = !ticket.requesterResolvedIndicator;
    try {
      setResolving(true);
      setResolveError("");
      const result = await markResolvedIndicator(ticket.id, nextState);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              requesterResolvedIndicator: result.requesterResolvedIndicator,
            }
          : prev
      );
    } catch (err) {
      setResolveError(
        err instanceof Error
          ? err.message
          : "Failed to update resolved indicator."
      );
    } finally {
      setResolving(false);
    }
  };

  const loadTicket = async () => {
    try {
      setLoading(true);
      setError("");
      setCommentsLoading(true);
      setCommentError("");

      const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.error || "Failed to fetch ticket.",
        );
      }

      const data = await response.json();
      setTicket(data);

      try {
        setComments(await getPublicComments(ticketId));
      } catch (err) {
        setComments([]);
        setCommentError(
          err instanceof Error
            ? err.message
            : "Failed to fetch public comments.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch ticket.",
      );
    } finally {
      setLoading(false);
      setCommentsLoading(false);
    }
  };


  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  async function handlePostComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = newComment.trim();

    if (!content) {
      setCommentError("Public comment cannot be empty or whitespace-only.");
      return;
    }

    try {
      setCommentSubmitting(true);
      setCommentError("");
      const created = await createPublicComment(ticketId, content);
      setComments((current) => [...current, created]);
      setNewComment("");
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "Failed to post public comment.",
      );
    } finally {
      setCommentSubmitting(false);
    }
  }


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

            {/* Problem Appears Resolved Section (FR-10, BR-14, UI spec §4.3) */}
            <div className="card mb-4 border-info-subtle">
              <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                <span className="fw-semibold small">Problem Appears Resolved</span>
                {ticket.requesterResolvedIndicator && (
                  <span className="badge bg-success">Marked as Resolved</span>
                )}
              </div>
              <div className="card-body py-3">
                <p className="text-muted small mb-3">
                  Indicates to IT Staff that the issue is fixed. IT Staff will review and formally close the ticket.
                </p>
                {resolveError && (
                  <div className="alert alert-danger py-2 mb-3" role="alert">
                    {resolveError}
                  </div>
                )}
                {ticket.requesterResolvedIndicator ? (
                  <div className="d-flex align-items-center gap-3">
                    <span className="text-success small fw-medium">
                      ✓ You have indicated this problem appears resolved.
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={handleToggleResolved}
                      disabled={resolving}
                    >
                      {resolving ? "Updating..." : "Unmark Resolved"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    onClick={handleToggleResolved}
                    disabled={resolving}
                  >
                    {resolving ? "Updating..." : "Mark as Problem Appears Resolved"}
                  </button>
                )}
              </div>
            </div>

            <div className="card border-success mb-4">
              <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                <h3 className="h6 mb-0">Public Comments</h3>
                <small>Visible to requester and staff</small>
              </div>
              <div className="card-body">
                {commentsLoading ? (
                  <p className="text-muted mb-3">Loading public comments...</p>
                ) : commentError && comments.length === 0 ? (
                  <div className="alert alert-danger" role="alert">
                    {commentError}
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-muted mb-3">No public comments yet.</p>
                ) : (
                  <div className="d-flex flex-column gap-2 mb-3">
                    {comments.map((comment) => (
                      <article key={comment.id} className="border rounded p-3 bg-light">
                        <div className="d-flex justify-content-between gap-3 small text-muted mb-1">
                          <div>
                            <strong className="text-dark me-2">{comment.author.name}</strong>
                            <span
                              className={`badge ${
                                comment.author.role === "REQUESTER"
                                  ? "bg-secondary"
                                  : comment.author.role === "IT_STAFF"
                                    ? "bg-primary"
                                    : "bg-dark"
                              }`}
                            >
                              {comment.author.role === "REQUESTER"
                                ? "Requester"
                                : comment.author.role === "IT_STAFF"
                                  ? "IT Staff"
                                  : "Administrator"}
                            </span>
                          </div>
                          <time dateTime={comment.createdAt}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </time>
                        </div>
                        <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                          {comment.content}
                        </p>
                      </article>
                    ))}
                  </div>
                )}

                <form onSubmit={handlePostComment}>
                  <label htmlFor="public-comment-content" className="form-label fw-semibold">
                    Add a public comment
                  </label>
                  <textarea
                    id="public-comment-content"
                    className="form-control mb-2"
                    rows={4}
                    maxLength={2000}
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder="Write a public comment visible to requester and staff..."
                    aria-label="Public comment content"
                    disabled={commentSubmitting}
                  />
                  {commentError && comments.length > 0 && (
                    <div className="alert alert-danger py-2" role="alert">
                      {commentError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={commentSubmitting}
                  >
                    {commentSubmitting ? "Posting..." : "Post Public Comment"}
                  </button>
                </form>
              </div>
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

                    try {
                    setError("");
                    const formData = new FormData();
                    formData.append("files", file);

                    const res = await fetch(`${API_URL}/api/tickets/${ticket.id}/attachments`, {
                        method: "POST",
                        credentials: "include",
                        headers: {},
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

                                try {
                                const response = await fetch(
                                    `${API_URL}/api/tickets/${ticket.id}/attachments/${attachment.id}/download`,
                                    {
                                      credentials: "include",
                                    headers: {},
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

                                try {
                                const res = await fetch(
                                    `${API_URL}/api/tickets/${ticket.id}/attachments/${attachment.id}`,
                                    {
                                    method: "DELETE",
                                    credentials: "include",
                                    headers: {
                                        "Content-Type": "application/json",
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
