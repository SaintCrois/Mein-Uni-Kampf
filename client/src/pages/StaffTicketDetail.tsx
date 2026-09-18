import { useEffect, useState } from "react";
import {
  getStaffTicketDetail,
  claimTicket,
  assignTicket,
  updateTicketPriority,
  updateTicketStatus,
  getStaffAssignees,
  getPublicComments,
  createPublicComment,
  getInternalNotes,
  createInternalNote,
  type TicketDetail,
  type PublicComment,
  type InternalNote,
  type StaffAssignee,
} from "../api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type StaffTicketDetailProps = {
  ticketId: number;
  onBack: () => void;
};

const allowedTransitionsMap: Record<string, string[]> = {
  New: ["Open", "Cancelled"],
  Open: ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
  "In Progress": ["Open", "Waiting for Requester", "Resolved", "Cancelled"],
  "Waiting for Requester": ["In Progress", "Open", "Resolved", "Cancelled"],
  Resolved: ["Closed", "Reopened", "Cancelled"],
  Reopened: ["In Progress", "Open", "Resolved", "Cancelled"],
  Closed: [],
  Cancelled: [],
};

export default function StaffTicketDetail({
  ticketId,
  onBack,
}: StaffTicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opSuccess, setOpSuccess] = useState("");

  // Assignee dropdown
  const [assignees, setAssignees] = useState<StaffAssignee[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");

  // IT Priority selection
  const [selectedPriority, setSelectedPriority] = useState<string>("");

  // Status transition selection
  const [selectedNextStatus, setSelectedNextStatus] = useState<string>("");

  // Communication hub
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [ticketData, assigneesData, commentsData, notesData] =
        await Promise.all([
          getStaffTicketDetail(ticketId),
          getStaffAssignees().catch(() => []),
          getPublicComments(ticketId).catch(() => []),
          getInternalNotes(ticketId).catch(() => []),
        ]);

      setTicket(ticketData);
      setAssignees(assigneesData);
      setComments(commentsData);
      setNotes(notesData);

      if (ticketData.owner) {
        setSelectedAssigneeId(String(ticketData.owner.id));
      } else {
        setSelectedAssigneeId("");
      }

      setSelectedPriority(ticketData.itPriority?.name ?? "Medium");

      const validTransitions =
        allowedTransitionsMap[ticketData.currentStatus.name] ?? [];
      setSelectedNextStatus(validTransitions[0] ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load ticket detail.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [ticketId]);

  // Operations: Claim
  async function handleClaim() {
    try {
      setError("");
      setOpSuccess("");
      const updated = await claimTicket(ticketId);
      setTicket(updated);
      setSelectedAssigneeId(String(updated.owner?.id ?? ""));
      const validTransitions =
        allowedTransitionsMap[updated.currentStatus.name] ?? [];
      setSelectedNextStatus(validTransitions[0] ?? "");
      setOpSuccess("Ticket claimed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim ticket.");
    }
  }

  // Operations: Assign
  async function handleAssign() {
    if (!selectedAssigneeId) return;
    try {
      setError("");
      setOpSuccess("");
      const updated = await assignTicket(ticketId, Number(selectedAssigneeId));
      setTicket(updated);
      const validTransitions =
        allowedTransitionsMap[updated.currentStatus.name] ?? [];
      setSelectedNextStatus(validTransitions[0] ?? "");
      setOpSuccess("Ticket assigned successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign ticket.");
    }
  }

  // Operations: Priority
  async function handleUpdatePriority() {
    if (!selectedPriority) return;
    try {
      setError("");
      setOpSuccess("");
      const updated = await updateTicketPriority(ticketId, selectedPriority);
      setTicket(updated);
      setOpSuccess("IT Priority updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update priority.",
      );
    }
  }

  // Operations: Status Transition
  async function handleUpdateStatus() {
    if (!selectedNextStatus) return;
    try {
      setError("");
      setOpSuccess("");
      const updated = await updateTicketStatus(ticketId, selectedNextStatus);
      setTicket(updated);
      const validTransitions =
        allowedTransitionsMap[updated.currentStatus.name] ?? [];
      setSelectedNextStatus(validTransitions[0] ?? "");
      setOpSuccess(`Status transitioned to "${updated.currentStatus.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  // Communication: Public Comment
  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) {
      setCommentError("Comment cannot be empty or whitespace-only.");
      return;
    }
    try {
      setCommentSubmitting(true);
      setCommentError("");
      const created = await createPublicComment(ticketId, newComment.trim());
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "Failed to post comment.",
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  // Communication: Internal Note
  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) {
      setNoteError("Internal note cannot be empty or whitespace-only.");
      return;
    }
    try {
      setNoteSubmitting(true);
      setNoteError("");
      const created = await createInternalNote(ticketId, newNote.trim());
      setNotes((prev) => [...prev, created]);
      setNewNote("");
    } catch (err) {
      setNoteError(
        err instanceof Error ? err.message : "Failed to add internal note.",
      );
    } finally {
      setNoteSubmitting(false);
    }
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

  if (loading) {
    return (
      <div className="alert alert-info d-flex align-items-center gap-2" role="status">
        <div className="spinner-border spinner-border-sm text-info" aria-hidden="true" />
        <span>Loading ticket details...</span>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="alert alert-danger">
        <h3 className="h5 alert-heading">Error</h3>
        <p className="mb-2">{error}</p>
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={onBack}>
          Back to Queue
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  const validTransitions =
    allowedTransitionsMap[ticket.currentStatus.name] ?? [];
  const isTerminalStatus = validTransitions.length === 0;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top action bar */}
      <div className="staff-detail-toolbar d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onBack}
        >
          &larr; Back to Queue
        </button>

        <span className="text-muted small zen-break-anywhere">
          Ticket ID: #{ticket.id} | Created: {new Date(ticket.createdAt).toLocaleString()}
        </span>
      </div>

      {/* Requester Resolution Banner */}
      {ticket.requesterResolvedIndicator && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-0" role="alert">
          <span className="fw-bold fs-5">&#10003;</span>
          <div>
            <strong>Problem Appears Resolved:</strong> The requester has indicated that this issue appears to be resolved. Please verify the solution and formally resolve or close this ticket.
          </div>
        </div>
      )}

      {/* Operational feedback alerts */}
      {opSuccess && (
        <div className="alert alert-success alert-dismissible fade show py-2 mb-0" role="alert">
          <span>{opSuccess}</span>
          <button
            type="button"
            className="btn-close py-2"
            onClick={() => setOpSuccess("")}
            aria-label="Close"
          />
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show py-2 mb-0" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="btn-close py-2"
            onClick={() => setError("")}
            aria-label="Close"
          />
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="row g-4">
        {/* =================================================================== */}
        {/* LEFT COLUMN: Ticket Information & Lifecycle Operations              */}
        {/* =================================================================== */}
        <div className="col-12 col-lg-7 d-flex flex-column gap-3">
          {/* Main Ticket Info Card */}
          <div className="card shadow-sm border">
            <div
              className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2 text-white"
              style={{ backgroundColor: "#006B3C" }}
            >
              <h2 className="h5 mb-0 fw-bold">{ticket.ticketNumber}</h2>
              <span className={getStatusBadgeClass(ticket.currentStatus.name)}>
                {ticket.currentStatus.name}
              </span>
            </div>

            <div className="card-body">
              <h3 className="h5 fw-bold mb-3">{ticket.summary}</h3>

              {/* Requester, Category, System */}
              <div className="row g-2 mb-3 p-2 rounded zen-readonly" style={{ backgroundColor: "#F3F6F4" }}>
                <div className="col-6 col-md-4">
                  <small className="text-muted d-block">Requester</small>
                  <strong>{ticket.requester?.name ?? "Unknown"}</strong>
                  <div className="small text-muted">{ticket.requester?.email}</div>
                </div>

                <div className="col-6 col-md-4">
                  <small className="text-muted d-block">Category</small>
                  <span>{ticket.category.name}</span>
                </div>

                <div className="col-6 col-md-4">
                  <small className="text-muted d-block">Related System</small>
                  <span>{ticket.relatedSystem.name}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">Description</label>
                <div
                  className="p-3 rounded border"
                  style={{ backgroundColor: "#FAFAFA", whiteSpace: "pre-wrap" }}
                >
                  {ticket.description}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="form-label text-muted small fw-bold">
                  Attachments ({ticket.attachments.filter((a) => a.status === "ACTIVE").length})
                </label>
                {ticket.attachments.length === 0 ? (
                  <p className="text-muted small mb-0">No attachments uploaded.</p>
                ) : (
                  <ul className="list-group list-group-flush border rounded">
                    {ticket.attachments.map((attachment) => (
                      <li
                        key={attachment.id}
                        className="list-group-item d-flex justify-content-between align-items-center py-2"
                      >
                        <div>
                          <span className="fw-semibold">{attachment.originalFileName}</span>
                          <small className="text-muted ms-2">
                            ({(attachment.fileSize / 1024).toFixed(1)} KB)
                          </small>
                          {attachment.status === "REMOVED" && (
                            <span className="badge bg-secondary ms-2">Removed</span>
                          )}
                        </div>

                        {attachment.status === "ACTIVE" && (
                          <a
                            href={`${API_URL}/api/tickets/${ticket.id}/attachments/${attachment.id}/download`}
                            className="btn btn-outline-success btn-sm"
                            download
                          >
                            Download
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Lifecycle Operations Card */}
          <div className="card shadow-sm border">
            <div className="card-header bg-light">
              <h3 className="h6 mb-0 fw-bold text-dark">Ticket Lifecycle Operations</h3>
            </div>

            <div className="card-body d-flex flex-column gap-3">
              {/* Ownership Controls */}
              <div>
                <label className="form-label fw-semibold small mb-1">Ownership</label>
                <div className="staff-operation-controls d-flex flex-wrap align-items-center gap-2">
                  <span className="small text-muted me-2">
                    Current: <strong>{ticket.owner ? ticket.owner.name : "Unassigned"}</strong>
                  </span>

                  {/* Claim Button */}
                  {!ticket.owner && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={handleClaim}
                    >
                      Claim Ticket
                    </button>
                  )}

                  {/* Assignee Dropdown */}
                  <div className="d-flex align-items-center gap-1 ms-auto">
                    <select
                      className="form-select form-select-sm"
                      style={{ width: "auto", minWidth: "180px" }}
                      value={selectedAssigneeId}
                      onChange={(e) => setSelectedAssigneeId(e.target.value)}
                      aria-label="Select assignee"
                    >
                      <option value="">-- Reassign to... --</option>
                      {assignees.map((assignee) => (
                        <option key={assignee.id} value={assignee.id}>
                          {assignee.name} ({assignee.role === "ADMINISTRATOR" ? "Admin" : "IT Staff"})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={!selectedAssigneeId || selectedAssigneeId === String(ticket.owner?.id ?? "")}
                      onClick={handleAssign}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>

              <hr className="my-1" />

              {/* IT Priority Controls */}
              <div>
                <label className="form-label fw-semibold small mb-1">Priority Dual-Tracking</label>
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-sm-6 d-flex align-items-center gap-2">
                    <span className="small text-muted">Requested:</span>
                    <span className={getPriorityBadgeClass(ticket.requestedPriority.name)}>
                      {ticket.requestedPriority.name}
                    </span>
                  </div>

                  <div className="col-12 col-sm-6 d-flex align-items-center gap-2 justify-content-sm-end">
                    <span className="small text-muted">IT Priority:</span>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: "auto" }}
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      aria-label="Select IT priority"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={selectedPriority === (ticket.itPriority?.name ?? "")}
                      onClick={handleUpdatePriority}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>

              <hr className="my-1" />

              {/* Status Transition Controls */}
              <div>
                <label className="form-label fw-semibold small mb-1">Status Workflow (BR-13)</label>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className="small text-muted me-2">
                    Current Status: <span className={getStatusBadgeClass(ticket.currentStatus.name)}>{ticket.currentStatus.name}</span>
                  </span>

                  {isTerminalStatus ? (
                    <span className="text-muted small">
                      This ticket is in a terminal status ({ticket.currentStatus.name}) and cannot be transitioned further.
                    </span>
                  ) : (
                    <div className="d-flex flex-wrap align-items-center gap-2 ms-lg-auto">
                      <select
                        className="form-select form-select-sm"
                        style={{ width: "auto", minWidth: "160px" }}
                        value={selectedNextStatus}
                        onChange={(e) => setSelectedNextStatus(e.target.value)}
                        aria-label="Select next status"
                      >
                        {validTransitions.map((nextStatusName) => (
                          <option key={nextStatusName} value={nextStatusName}>
                            &rarr; {nextStatusName}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        disabled={!selectedNextStatus}
                        onClick={handleUpdateStatus}
                      >
                        Update Status
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: Communication Hub (Visually Separated)                */}
        {/* =================================================================== */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-3">
          {/* Public Comments Box (Green Accent) */}
          <div className="card shadow-sm border border-success">
            <div
              className="communication-header card-header text-white d-flex justify-content-between align-items-center py-2"
              style={{ backgroundColor: "#006B3C" }}
            >
              <h4 className="h6 mb-0 fw-bold">Public Comments</h4>
              <small style={{ color: "#EAF6EF" }}>
                Visible to Requester and Staff
              </small>
            </div>

            <div className="card-body p-3" style={{ backgroundColor: "#F9FCFA" }}>
              {/* Comment List */}
              <div
                className="d-flex flex-column gap-2 mb-3 overflow-auto"
                style={{ maxHeight: "260px" }}
              >
                {comments.length === 0 ? (
                  <p className="text-muted small text-center my-3">
                    No public comments yet.
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-2 rounded border bg-white shadow-sm"
                    >
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-1 mb-1">
                        <div className="d-flex align-items-center gap-1">
                          <strong className="small">{comment.author.name}</strong>
                          <span
                            className={
                              comment.author.role === "REQUESTER"
                                ? "badge bg-secondary"
                                : comment.author.role === "IT_STAFF"
                                  ? "badge bg-primary"
                                  : "badge bg-dark"
                            }
                            style={{ fontSize: "0.65rem" }}
                          >
                            {comment.author.role}
                          </span>
                        </div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </div>
                      <p className="small mb-0" style={{ whiteSpace: "pre-wrap" }}>
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* New Comment Input Form */}
              <form onSubmit={handlePostComment}>
                {commentError && (
                  <div className="alert alert-danger py-1 px-2 small mb-2">
                    {commentError}
                  </div>
                )}
                <div className="mb-2">
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    placeholder="Write a public comment (visible to requester)..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={2000}
                    aria-label="Public comment content"
                  />
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: "0.7rem" }}>
                    <span>Max 2000 characters</span>
                    <span>{newComment.length}/2000</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-success btn-sm w-100"
                  disabled={commentSubmitting || !newComment.trim()}
                >
                  {commentSubmitting ? "Posting..." : "Post Public Comment"}
                </button>
              </form>
            </div>
          </div>

          {/* Internal Notes Box (Amber/Gold Accent) */}
          <div
            className="card shadow-sm"
            style={{ borderColor: "#D97706" }}
          >
            <div
              className="communication-header card-header text-white d-flex justify-content-between align-items-center py-2"
              style={{ backgroundColor: "#D97706" }}
            >
              <h4 className="h6 mb-0 fw-bold d-flex align-items-center gap-1">
                <span>&#128274;</span> Internal Notes
              </h4>
              <small style={{ color: "#FEF3C7" }}>
                Strictly Private &mdash; Staff &amp; Admin Only
              </small>
            </div>

            <div className="card-body p-3" style={{ backgroundColor: "#FFFDF5" }}>
              {/* Notes List */}
              <div
                className="d-flex flex-column gap-2 mb-3 overflow-auto"
                style={{ maxHeight: "260px" }}
              >
                {notes.length === 0 ? (
                  <p className="text-muted small text-center my-3">
                    No internal notes yet.
                  </p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-2 rounded border bg-white shadow-sm"
                      style={{ borderLeft: "3px solid #D97706" }}
                    >
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-1 mb-1">
                        <div className="d-flex align-items-center gap-1">
                          <strong className="small">{note.author.name}</strong>
                          <span
                            className={
                              note.author.role === "ADMINISTRATOR"
                                ? "badge bg-dark"
                                : "badge bg-primary"
                            }
                            style={{ fontSize: "0.65rem" }}
                          >
                            {note.author.role}
                          </span>
                        </div>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {new Date(note.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </div>
                      <p className="small mb-0" style={{ whiteSpace: "pre-wrap" }}>
                        {note.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* New Internal Note Form */}
              <form onSubmit={handleCreateNote}>
                {noteError && (
                  <div className="alert alert-danger py-1 px-2 small mb-2">
                    {noteError}
                  </div>
                )}
                <div className="mb-2">
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    placeholder="Add private internal note (never visible to requester)..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    maxLength={2000}
                    aria-label="Internal note content"
                  />
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: "0.7rem" }}>
                    <span>Max 2000 characters</span>
                    <span>{newNote.length}/2000</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-warning btn-sm w-100 text-dark fw-semibold"
                  style={{ backgroundColor: "#D97706", borderColor: "#D97706", color: "white" }}
                  disabled={noteSubmitting || !newNote.trim()}
                >
                  {noteSubmitting ? "Saving..." : "Add Internal Note"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
