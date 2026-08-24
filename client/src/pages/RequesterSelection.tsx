import { useEffect, useState } from "react";
import { getActiveRequesters, Requester } from "../api";
import { useRequester } from "../context/RequesterContext";

export default function RequesterSelection() {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const { setSelectedRequester } = useRequester();

  useEffect(() => {
    async function loadRequesters() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await getActiveRequesters();

        // Backend should already return active Requesters.
        // Keep this check as a defensive frontend safeguard.
        setRequesters(data.filter((requester) => requester.isActive));
      } catch (error) {
        setRequesters([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load active Requesters.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRequesters();
  }, []);

  function handleContinue() {
    const requester = requesters.find(
      (item) => item.id === Number(selectedId),
    );

    if (requester) {
      setSelectedRequester(requester);
    }
  }

  if (loading) {
    return (
      <main className="container py-5" style={{ maxWidth: 640 }}>
        <div className="alert alert-info" role="status">
          Loading active Requesters...
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="container py-5" style={{ maxWidth: 640 }}>
        <div className="alert alert-danger" role="alert">
          <strong>Unable to load Requesters.</strong>
          <p className="mb-0 mt-2">{errorMessage}</p>
        </div>
      </main>
    );
  }

  if (requesters.length === 0) {
    return (
      <main className="container py-5" style={{ maxWidth: 640 }}>
        <div className="alert alert-warning" role="alert">
          No active Development Requesters are available.
        </div>
      </main>
    );
  }

  return (
    <main className="container py-5" style={{ maxWidth: 640 }}>
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h1 className="h3 mb-3" style={{ color: "#006B3C" }}>
            Select Development Requester
          </h1>

          <p className="text-muted">
            Select a Development Requester to test requester-specific ticket
            behavior. This is not a login screen.
          </p>

          <div className="mb-3">
            <label htmlFor="requester" className="form-label fw-semibold">
              Development Requester <span className="text-danger">*</span>
            </label>

            <select
              id="requester"
              className="form-select"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              <option value="">Select a requester...</option>

              {requesters.map((requester) => (
                <option key={requester.id} value={requester.id}>
                  {requester.fullName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-success"
            disabled={!selectedId}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </main>
  );
}