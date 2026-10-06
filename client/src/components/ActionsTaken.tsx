import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ApiError,
  createActionTaken,
  getActionsTaken,
  updateActionTaken,
  type ActionTaken,
} from "../api";
import { useOptionalAuth } from "../context/AuthContext";

type ActionsTakenProps = {
  ticketId: number;
  /**
   * UX-only permission flag. `true` for IT Staff / Administrators (Staff
   * Ticket Detail); `false` for Requesters (read-only). The backend remains
   * the authority for every write.
   */
  canManage: boolean;
};

type ModalMode = "create" | "edit";

interface ActionFormState {
  actionDateTime: string;
  actionDescription: string;
  result: string;
  isFollowUpRequired: boolean;
  followUpNote: string;
  attachmentNotes: string;
}

type FormErrors = Partial<Record<keyof ActionFormState, string>>;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toLocalInputValue(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function emptyForm(): ActionFormState {
  return {
    actionDateTime: toLocalInputValue(new Date()),
    actionDescription: "",
    result: "",
    isFollowUpRequired: false,
    followUpNote: "",
    attachmentNotes: "",
  };
}

function actionToForm(action: ActionTaken): ActionFormState {
  return {
    actionDateTime: toLocalInputValue(new Date(action.actionDateTime)),
    actionDescription: action.actionDescription,
    result: action.result,
    isFollowUpRequired: action.isFollowUpRequired,
    followUpNote: action.followUpNote ?? "",
    attachmentNotes: action.attachmentNotes ?? "",
  };
}

/**
 * Client-side validation mirroring the Issue 24 backend contract so users get
 * immediate feedback. Server-side validation remains authoritative.
 */
function validateActionForm(form: ActionFormState): FormErrors {
  const errors: FormErrors = {};

  const description = form.actionDescription.trim();
  if (description.length === 0) {
    errors.actionDescription = "Action description is required.";
  } else if (description.length < 3 || description.length > 2000) {
    errors.actionDescription =
      "Action description must be between 3 and 2000 characters.";
  }

  const result = form.result.trim();
  if (result.length === 0) {
    errors.result = "Result is required.";
  } else if (result.length > 2000) {
    errors.result = "Result must be 2000 characters or fewer.";
  }

  if (!form.actionDateTime || isNaN(Date.parse(form.actionDateTime))) {
    errors.actionDateTime = "Action date/time must be a valid date.";
  }

  if (form.isFollowUpRequired) {
    const note = form.followUpNote.trim();
    if (note.length < 3 || note.length > 2000) {
      errors.followUpNote =
        "Follow-up note is required (3 to 2000 characters) when follow-up is requested.";
    }
  }

  if (form.attachmentNotes.trim().length > 1000) {
    errors.attachmentNotes = "Attachment notes must be 1000 characters or fewer.";
  }

  return errors;
}

/** Stable chronological ordering: actionDateTime ASC, then id ASC. */
function sortActions(list: ActionTaken[]): ActionTaken[] {
  return [...list].sort((a, b) => {
    const aTime = Date.parse(a.actionDateTime) || 0;
    const bTime = Date.parse(b.actionDateTime) || 0;
    if (aTime !== bTime) return aTime - bTime;
    return a.id - b.id;
  });
}

function formatRole(role: string): string {
  switch (role) {
    case "ADMINISTRATOR":
      return "Admin";
    case "IT_STAFF":
      return "IT Staff";
    case "REQUESTER":
      return "Requester";
    default:
      return role;
  }
}

function roleBadgeClass(role: string): string {
  return role === "ADMINISTRATOR" ? "badge bg-dark" : "badge bg-primary";
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function ActionsTaken({ ticketId, canManage }: ActionsTakenProps) {
  const auth = useOptionalAuth();

  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);
  const [viewingAction, setViewingAction] = useState<ActionTaken | null>(null);
  const [form, setForm] = useState<ActionFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);
      setLoadError("");
      setForbidden(false);
      try {
        const data = await getActionsTaken(ticketId);
        setActions(sortActions(data));
      } catch (err) {
        setActions([]);
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true);
        } else {
          setLoadError(
            err instanceof Error ? err.message : "Failed to fetch actions taken.",
          );
        }
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [ticketId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setForm(emptyForm());
    setFormErrors({});
    setFormError("");
    setEditingAction(null);
    setModalMode("create");
  }

  function openEdit(action: ActionTaken) {
    setForm(actionToForm(action));
    setFormErrors({});
    setFormError("");
    setEditingAction(action);
    setModalMode("edit");
  }

  function closeModal() {
    if (saving) return;
    setModalMode(null);
    setEditingAction(null);
    setFormErrors({});
    setFormError("");
  }

  function setField<K extends keyof ActionFormState>(
    field: K,
    value: ActionFormState[K],
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFormErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Guard against accidental duplicate submission.
    if (saving) return;

    const errors = validateActionForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setFormError("");

    const payload = {
      actionDateTime: new Date(form.actionDateTime).toISOString(),
      actionDescription: form.actionDescription.trim(),
      result: form.result.trim(),
      isFollowUpRequired: form.isFollowUpRequired,
      followUpNote: form.isFollowUpRequired ? form.followUpNote.trim() : null,
      attachmentNotes: form.attachmentNotes.trim()
        ? form.attachmentNotes.trim()
        : null,
    };

    try {
      if (modalMode === "edit" && editingAction) {
        await updateActionTaken(
          ticketId,
          editingAction.id,
          payload,
          editingAction.updatedAt,
        );
        setSuccessMessage("Action Taken updated successfully.");
      } else {
        await createActionTaken(ticketId, payload);
        setSuccessMessage("Action Taken recorded successfully.");
      }

      setModalMode(null);
      setEditingAction(null);
      setForm(emptyForm());
      setFormErrors({});
      await load({ silent: true });
    } catch (err) {
      // Preserve the entered data so the user can retry after a failure.
      if (err instanceof ApiError && err.code === "CONCURRENCY_CONFLICT") {
        setFormError(
          "This Action Taken was modified by another operation. The list has been refreshed — close this form, review the latest data, and try again.",
        );
        await load({ silent: true });
      } else if (err instanceof ApiError && err.status === 403) {
        setFormError(
          err.message || "You do not have permission to modify Actions Taken.",
        );
      } else {
        setFormError(
          err instanceof Error ? err.message : "Failed to save Action Taken.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const performedByLabel =
    modalMode === "edit" && editingAction
      ? `${editingAction.performedBy.name} (${formatRole(editingAction.performedBy.role)})`
      : auth?.user
        ? `${auth.user.name} (${formatRole(auth.user.role)})`
        : "Set automatically from your authenticated session";

  return (
    <section
      className="card shadow-sm border mb-3"
      aria-labelledby="actions-taken-heading"
    >
      <div
        className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2 text-white py-2"
        style={{ backgroundColor: "#006B3C" }}
      >
        <div>
          <h2 id="actions-taken-heading" className="h6 mb-0 fw-bold">
            Actions Taken
          </h2>
          <small style={{ color: "#EAF6EF" }}>
            Technical work recorded for this ticket
          </small>
        </div>
        {canManage && !forbidden && !loadError && (
          <button
            type="button"
            className="btn btn-light btn-sm fw-semibold"
            onClick={openCreate}
          >
            + Add Action Taken
          </button>
        )}
      </div>

      <div className="card-body p-3">
        {successMessage && (
          <div
            className="alert alert-success py-2 d-flex justify-content-between align-items-center"
            role="status"
          >
            <span>{successMessage}</span>
            <button
              type="button"
              className="btn-close"
              aria-label="Dismiss success message"
              onClick={() => setSuccessMessage("")}
            />
          </div>
        )}

        {loading ? (
          <div className="d-flex align-items-center gap-2 text-muted" role="status">
            <div className="spinner-border spinner-border-sm" aria-hidden="true" />
            <span>Loading actions taken...</span>
          </div>
        ) : forbidden ? (
          <div className="alert alert-warning mb-0 py-2" role="alert">
            You do not have permission to view Actions Taken for this ticket.
          </div>
        ) : loadError ? (
          <div className="alert alert-danger py-2 mb-0" role="alert">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span>{loadError}</span>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => void load()}
              >
                Retry
              </button>
            </div>
          </div>
        ) : actions.length === 0 ? (
          <p className="text-muted small text-center my-3 mb-0">
            No Actions Taken have been recorded for this ticket yet.
            {canManage &&
              " Use \u201CAdd Action Taken\u201D to log the first technical action."}
          </p>
        ) : (
          <div className="table-responsive actions-taken-scroll">
            <table className="table table-sm align-middle mb-0 actions-taken-table">
              <thead className="table-light">
                <tr>
                  <th scope="col">Action Date/Time</th>
                  <th scope="col">Action Description</th>
                  <th scope="col">Result</th>
                  <th scope="col">Performed By</th>
                  <th scope="col">Follow-Up</th>
                  <th scope="col">Attachment Notes</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action) => (
                  <tr key={action.id} data-testid="action-taken-item">
                    <td data-label="Action Date/Time" className="text-nowrap">
                      {formatDateTime(action.actionDateTime)}
                    </td>
                    <td
                      data-label="Action Description"
                      className="zen-break-anywhere"
                      style={{ whiteSpace: "pre-wrap", minWidth: "160px" }}
                    >
                      {action.actionDescription}
                    </td>
                    <td
                      data-label="Result"
                      className="zen-break-anywhere"
                      style={{ whiteSpace: "pre-wrap", minWidth: "140px" }}
                    >
                      {action.result}
                    </td>
                    <td data-label="Performed By" className="text-nowrap">
                      {action.performedBy.name}{" "}
                      <span
                        className={roleBadgeClass(action.performedBy.role)}
                        style={{ fontSize: "0.65rem" }}
                      >
                        {formatRole(action.performedBy.role)}
                      </span>
                    </td>
                    <td data-label="Follow-Up" style={{ minWidth: "140px" }}>
                      {action.isFollowUpRequired ? (
                        <div>
                          <span className="badge bg-warning text-dark border border-warning">
                            Follow-Up Required
                          </span>
                          {action.followUpNote && (
                            <div
                              className="small text-muted mt-1 zen-break-anywhere"
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {action.followUpNote}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="badge bg-light text-muted">None</span>
                      )}
                    </td>
                    <td
                      data-label="Attachment Notes"
                      className="zen-break-anywhere"
                      style={{ minWidth: "120px" }}
                    >
                      {action.attachmentNotes ? (
                        <span className="small">
                          &#128206; {action.attachmentNotes}
                        </span>
                      ) : (
                        <span className="text-muted">&mdash;</span>
                      )}
                    </td>
                    <td data-label="Actions">
                      <div className="d-flex gap-1 justify-content-end">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setViewingAction(action)}
                        >
                          View
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => openEdit(action)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Action Taken modal (all roles) */}
      {viewingAction && (
        <>
          <div className="modal-backdrop fade show" aria-hidden="true" />
          <div
            className="modal d-block"
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-action-title"
            tabIndex={-1}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 id="view-action-title" className="modal-title h5">
                    Action Taken Details
                  </h3>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setViewingAction(null)}
                  />
                </div>
                <div className="modal-body">
                  <dl className="row mb-0">
                    <dt className="col-sm-4">Action Date/Time</dt>
                    <dd className="col-sm-8">
                      {formatDateTime(viewingAction.actionDateTime)}
                    </dd>

                    <dt className="col-sm-4">Action Description</dt>
                    <dd
                      className="col-sm-8 zen-break-anywhere"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {viewingAction.actionDescription}
                    </dd>

                    <dt className="col-sm-4">Result</dt>
                    <dd
                      className="col-sm-8 zen-break-anywhere"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {viewingAction.result}
                    </dd>

                    <dt className="col-sm-4">Performed By</dt>
                    <dd className="col-sm-8">
                      {viewingAction.performedBy.name}{" "}
                      <span className={roleBadgeClass(viewingAction.performedBy.role)}>
                        {formatRole(viewingAction.performedBy.role)}
                      </span>
                    </dd>

                    <dt className="col-sm-4">Follow-Up Required</dt>
                    <dd className="col-sm-8">
                      {viewingAction.isFollowUpRequired ? "Yes" : "No"}
                      {viewingAction.isFollowUpRequired &&
                        viewingAction.followUpNote && (
                          <div
                            className="small text-muted mt-1 zen-break-anywhere"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {viewingAction.followUpNote}
                          </div>
                        )}
                    </dd>

                    <dt className="col-sm-4">Attachment Notes</dt>
                    <dd className="col-sm-8 zen-break-anywhere">
                      {viewingAction.attachmentNotes || "None"}
                    </dd>
                  </dl>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setViewingAction(null)}
                  >
                    Close
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        const action = viewingAction;
                        setViewingAction(null);
                        openEdit(action);
                      }}
                    >
                      Edit Action Taken
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create / Edit Action Taken modal (IT Staff / Administrator only) */}
      {modalMode && (
        <>
          <div className="modal-backdrop fade show" aria-hidden="true" />
          <div
            className="modal d-block"
            role="dialog"
            aria-modal="true"
            aria-labelledby="action-form-title"
            tabIndex={-1}
          >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <form className="modal-content" onSubmit={handleSubmit} noValidate>
              <div className="modal-header">
                <h3 id="action-form-title" className="modal-title h5">
                  {modalMode === "edit"
                    ? "Edit Action Taken"
                    : "Add Action Taken"}
                </h3>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeModal}
                  disabled={saving}
                />
              </div>

              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {formError}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="action-date-time" className="form-label">
                    Action Date/Time
                  </label>
                  <input
                    id="action-date-time"
                    type="datetime-local"
                    className={`form-control${
                      formErrors.actionDateTime ? " is-invalid" : ""
                    }`}
                    value={form.actionDateTime}
                    onChange={(event) =>
                      setField("actionDateTime", event.target.value)
                    }
                    disabled={saving}
                    required
                  />
                  {formErrors.actionDateTime && (
                    <div className="invalid-feedback d-block">
                      {formErrors.actionDateTime}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="action-performed-by" className="form-label">
                    Performed By
                  </label>
                  <input
                    id="action-performed-by"
                    className="form-control"
                    value={performedByLabel}
                    readOnly
                    disabled
                  />
                  <div className="form-text">
                    {modalMode === "edit"
                      ? "The performer of an Action Taken cannot be changed."
                      : "Recorded automatically from your authenticated session."}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="action-description" className="form-label">
                    Action Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="action-description"
                    className={`form-control${
                      formErrors.actionDescription ? " is-invalid" : ""
                    }`}
                    rows={3}
                    maxLength={2000}
                    value={form.actionDescription}
                    onChange={(event) =>
                      setField("actionDescription", event.target.value)
                    }
                    disabled={saving}
                    aria-invalid={
                      formErrors.actionDescription ? "true" : undefined
                    }
                  />
                  {formErrors.actionDescription && (
                    <div className="invalid-feedback d-block">
                      {formErrors.actionDescription}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="action-result" className="form-label">
                    Result <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="action-result"
                    className={`form-control${formErrors.result ? " is-invalid" : ""}`}
                    rows={2}
                    maxLength={2000}
                    value={form.result}
                    onChange={(event) => setField("result", event.target.value)}
                    disabled={saving}
                    aria-invalid={formErrors.result ? "true" : undefined}
                  />
                  {formErrors.result && (
                    <div className="invalid-feedback d-block">
                      {formErrors.result}
                    </div>
                  )}
                </div>

                <div className="form-check mb-3">
                  <input
                    id="action-follow-up-required"
                    type="checkbox"
                    className="form-check-input"
                    checked={form.isFollowUpRequired}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        isFollowUpRequired: event.target.checked,
                        followUpNote: event.target.checked
                          ? previous.followUpNote
                          : "",
                      }))
                    }
                    disabled={saving}
                  />
                  <label
                    htmlFor="action-follow-up-required"
                    className="form-check-label"
                  >
                    Follow-Up Required
                  </label>
                </div>

                {form.isFollowUpRequired && (
                  <div className="mb-3">
                    <label htmlFor="action-follow-up-note" className="form-label">
                      Follow-Up Note <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="action-follow-up-note"
                      className={`form-control${
                        formErrors.followUpNote ? " is-invalid" : ""
                      }`}
                      rows={2}
                      maxLength={2000}
                      value={form.followUpNote}
                      onChange={(event) =>
                        setField("followUpNote", event.target.value)
                      }
                      disabled={saving}
                      aria-invalid={
                        formErrors.followUpNote ? "true" : undefined
                      }
                    />
                    {formErrors.followUpNote && (
                      <div className="invalid-feedback d-block">
                        {formErrors.followUpNote}
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-2">
                  <label htmlFor="action-attachment-notes" className="form-label">
                    Attachment Notes
                  </label>
                  <input
                    id="action-attachment-notes"
                    type="text"
                    className={`form-control${
                      formErrors.attachmentNotes ? " is-invalid" : ""
                    }`}
                    maxLength={1000}
                    placeholder="Reference related ticket attachments (optional)"
                    value={form.attachmentNotes}
                    onChange={(event) =>
                      setField("attachmentNotes", event.target.value)
                    }
                    disabled={saving}
                    aria-invalid={
                      formErrors.attachmentNotes ? "true" : undefined
                    }
                  />
                  {formErrors.attachmentNotes && (
                    <div className="invalid-feedback d-block">
                      {formErrors.attachmentNotes}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      />
                      Saving...
                    </>
                  ) : modalMode === "edit" ? (
                    "Save Changes"
                  ) : (
                    "Create Action Taken"
                  )}
                </button>
              </div>
            </form>
          </div>
          </div>
        </>
      )}

    </section>
  );
}







