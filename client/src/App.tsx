import { useState, useEffect } from "react";
import { checkSystem, Category } from "./api.js";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import RequesterSelection from "./pages/RequesterSelection";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

function AppShell() {
  const { selectedRequester, setSelectedRequester } = useRequester();
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [healthStatus, setHealthStatus] = useState<string>("Checking status...");
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  //Mein Issue 2
  useEffect(() => {
    fetch("http://localhost:3000/api/health")
    .then((res) => res.json())
    .then((data) => setHealthStatus(`Status: ${data.status} | Service: ${data.service}`))
    .catch(() => setHealthStatus("Backend disconnected"));
  }, []);
  
  if (!selectedRequester) {
    return <RequesterSelection />;
  }

  async function handleCheck() {
    // TODO(Issue 4): set loading, call checkSystem(), then either
    //   - success: store categories and show Online + the list, or
    //   - error: show Offline + a useful message.
    setState("loading");
    setErrorMessage("");

    try {
      const data = await checkSystem();
      setCategories(Array.isArray(data) ? data : (data as any)?.categories || []);
      setState("success");
    } catch (err: any) {
      setState("error");
      setErrorMessage(err.message || "Failed to fetch category list.");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">
          TokTickIT <span className="text-success">IT Service Desk</span>
        </h1>

        <div className="text-end">
          <div className="fw-bold">{selectedRequester.fullName}</div>
          <button
            type="button"
            className="btn btn-outline-success btn-sm mt-1"
            onClick={() => setSelectedRequester(null)}
          >
            Change Requester
          </button>
        </div>
      </div>

      <button className="btn btn-success" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      <div className="alert alert-info mt-4" role="alert">
        <strong>API Health:</strong> {healthStatus}
      </div>

      {/* TODO(Issue 4): render loading / success (Online + categories) / error (Offline) states. */}
      {/* Success State */}
      {state === "success" && (
        <div className="alert alert-success mt-4" role="alert">
          <h4 className="alert-heading h5">System Online</h4>
          <hr />
          <p className="mb-2"><strong>Categories loaded:</strong></p>
          <ul className="mb-0">
            {categories?.map((cat) => (
              <li key={cat.id}>{cat.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error State */}
      {state === "error" && (
        <div className="alert alert-danger mt-4" role="alert">
          <h4 className="alert-heading h5">System Offline</h4>
          <p className="mb-0">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <AppShell />
    </RequesterProvider>
  );
}