import { useEffect, useRef, useState } from "react";
import { useRequester } from "../context/RequesterContext";
import {
  createTicket,
  getCategories,
  getRelatedSystems,
  getPriorities,
  uploadTicketAttachments,
  ReferenceItem,
} from "../api";

export default function CreateTicket() {
  const { selectedRequester } = useRequester();

  const [categories, setCategories] = useState<ReferenceItem[]>([]);
  const [systems, setSystems] = useState<ReferenceItem[]>([]);
  const [priorities, setPriorities] = useState<ReferenceItem[]>([]);

  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [relatedSystemId, setRelatedSystemId] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [error, setError] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  useEffect(() => {
    async function loadReferences() {
      try {
        const [categoryData, systemData, priorityData] = await Promise.all([
          getCategories(),
          getRelatedSystems(),
          getPriorities(),
        ]);

        setCategories(categoryData.filter((item) => item.name));
        setSystems(systemData.filter((item) => item.name));
        setPriorities(priorityData.filter((item) => item.name));
      } catch {
        setError("Unable to load ticket reference data.");
      } finally {
        setLoadingReferences(false);
      }
    }

    loadReferences();
  }, []);

  function validate() {
    const newErrors: Record<string, string> = {};

    if (!categoryId) newErrors.categoryId = "Category is required.";
    if (!relatedSystemId) {
      newErrors.relatedSystemId = "Related System is required.";
    }
    if (!requestedPriority) {
      newErrors.requestedPriority = "Requested Priority is required.";
    }

    if (!summary.trim()) {
      newErrors.summary = "Summary is required.";
    } else if (summary.trim().length > 150) {
      newErrors.summary = "Summary must be 150 characters or fewer.";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required.";
    } else if (description.trim().length > 2000) {
      newErrors.description =
        "Description must be 2000 characters or fewer.";
    }

    if (attachments.length > 5) {
      newErrors.attachments = "Maximum 5 files are allowed.";
    }

    for (const file of attachments) {
      if (file.size > 5 * 1024 * 1024) {
        newErrors.attachments = "Each file must be 5 MB or smaller.";
        break;
      }

      if (
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
          "application/pdf",
        ].includes(file.type)
      ) {
        newErrors.attachments =
          "Only JPG, PNG, WEBP, and PDF files are allowed.";
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (submitting) {
        return;
    }
    setTicketNumber("");
    setError("");

    if (!selectedRequester) {
      setError("Please select a requester first.");
      return;
    }

    if (!validate()) return;

    setSubmitting(true);

    try {
      const result = await createTicket({
        requesterId: selectedRequester.id,
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        summary,
        requestedPriorityId: Number(requestedPriority),
        description,
        attachments,
      });


      
    if (attachments.length > 0) {
        await uploadTicketAttachments(
            result.id,
            selectedRequester.id,
            attachments,
        );
    }

    setTicketNumber(result.ticketNumber);

    setSummary("");
    setCategoryId("");
    setRelatedSystemId("");
    setRequestedPriority("");
    setDescription("");
    setAttachments([]);
    if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
    }
    setErrors({});
    
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create ticket.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="container py-4" style={{ maxWidth: 900 }}>
      <div className="mb-4">
        <h1 className="h3" style={{ color: "#006B3C" }}>
          Create Ticket
        </h1>
        <p className="text-muted mb-0">
          Describe your IT support request and submit it to TokTickIT.
        </p>
      </div>

      {loadingReferences && (
        <div className="alert alert-info">
          Loading ticket reference data...
        </div>
      )}

      {ticketNumber && (
        <div className="alert alert-success">
          Ticket created successfully. Ticket Number:{" "}
          <strong>{ticketNumber}</strong>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold">Requester</label>
              <input
                className="form-control"
                value={selectedRequester?.fullName ?? ""}
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label htmlFor="category" className="form-label fw-semibold">
                Category
              </label>

              <select
                id="category"
                className={`form-select ${
                  errors.categoryId ? "is-invalid" : ""
                }`}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {errors.categoryId && (
                <div className="invalid-feedback">{errors.categoryId}</div>
              )}
            </div>

            <div className="col-md-6">
              <label
                htmlFor="related-system"
                className="form-label fw-semibold"
              >
                Related System
              </label>

              <select
                id="related-system"
                className={`form-select ${
                  errors.relatedSystemId ? "is-invalid" : ""
                }`}
                value={relatedSystemId}
                onChange={(e) => setRelatedSystemId(e.target.value)}
              >
                <option value="">Select related system...</option>
                {systems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </select>

              {errors.relatedSystemId && (
                <div className="invalid-feedback">
                  {errors.relatedSystemId}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label
                htmlFor="requested-priority"
                className="form-label fw-semibold"
              >
                Requested Priority
              </label>

              <select
                id="requested-priority"
                className={`form-select ${
                  errors.requestedPriority ? "is-invalid" : ""
                }`}
                value={requestedPriority}
                onChange={(e) => setRequestedPriority(e.target.value)}
              >
                <option value="">Select priority...</option>
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>

              {errors.requestedPriority && (
                <div className="invalid-feedback">
                  {errors.requestedPriority}
                </div>
              )}
            </div>

            <div className="col-12">
              <label htmlFor="summary" className="form-label fw-semibold">
                Ticket Summary
              </label>

              <input
                id="summary"
                className={`form-control ${
                  errors.summary ? "is-invalid" : ""
                }`}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />

              {errors.summary && (
                <div className="invalid-feedback">{errors.summary}</div>
              )}
            </div>

            <div className="col-12">
              <label
                htmlFor="description"
                className="form-label fw-semibold"
              >
                Description
              </label>

              <textarea
                id="description"
                className={`form-control ${
                  errors.description ? "is-invalid" : ""
                }`}
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {errors.description && (
                <div className="invalid-feedback">
                  {errors.description}
                </div>
              )}
            </div>

            <div className="col-12">
              <label
                htmlFor="attachments"
                className="form-label fw-semibold"
              >
                Attachments
              </label>

              <input
                id="attachments"
                type="file"
                ref={attachmentInputRef}
                className={`form-control ${
                  errors.attachments ? "is-invalid" : ""
                }`}
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                multiple
                onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setAttachments(files);

                    let attachmentError = "";

                    if (files.length > 5) {
                        attachmentError = "Maximum 5 files are allowed.";
                    } else {
                        for (const file of files) {
                        if (file.size > 5 * 1024 * 1024) {
                            attachmentError = "Each file must be 5 MB or smaller.";
                            break;
                        }

                        if (
                            ![
                            "image/jpeg",
                            "image/png",
                            "image/webp",
                            "application/pdf",
                            ].includes(file.type)
                        ) {
                            attachmentError =
                            "Only JPG, PNG, WEBP, and PDF files are allowed.";
                            break;
                        }
                        }
                    }

                    setErrors((current) => ({
                        ...current,
                        attachments: attachmentError,
                    }));
                }}
              />

              <div className="form-text">
                JPG, JPEG, PNG, WEBP, or PDF. Maximum 5 MB per file and 5
                files.
              </div>

              {errors.attachments && (
                <div className="invalid-feedback">
                  {errors.attachments}
                </div>
              )}

              {attachments.length > 0 && (
                <ul className="mt-2">
                  {attachments.map((file) => (
                    <li key={`${file.name}-${file.size}`}>
                      {file.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="col-12 d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-success"
                disabled={submitting || loadingReferences}
                onClick={handleSubmit}
              >
                {submitting ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}