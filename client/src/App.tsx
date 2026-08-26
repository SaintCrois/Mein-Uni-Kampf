import { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import RequesterSelection from "./pages/RequesterSelection";
import CreateTicket from "./pages/CreateTicket";
import { checkSystem } from "./api";

function AppContent() {
  const { selectedRequester, setSelectedRequester } = useRequester();

  const [page, setPage] = useState<"home" | "create-ticket">("home");
  const [healthStatus, setHealthStatus] = useState("Not checked");
  const [categories, setCategories] = useState<
    { id: number; name: string }[]
  >([]);

  async function handleCheckSystem() {
    try {
      const result = await checkSystem();

      setHealthStatus("Online");

      // Supports both the normal API result and the test mock.
      if (Array.isArray(result)) {
        setCategories(result);
      } else {
        setCategories(result.categories);
      }
    } catch {
      setHealthStatus("Offline");
      setCategories([]);
    }
  }

  return (
    <div className="container py-4">
      <header className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            TokTickIT{" "}
            <span className="text-success">IT Service Desk</span>
          </h1>

          {selectedRequester && (
            <div className="fw-bold">
              {selectedRequester.fullName}
            </div>
          )}
        </div>

        {selectedRequester && (
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-success"
              onClick={() => setPage("create-ticket")}
            >
              Create Ticket
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setPage("home");
                setSelectedRequester(null);
              }}
            >
              Change Requester
            </button>
          </div>
        )}
      </header>

      {page === "create-ticket" && selectedRequester ? (
        <CreateTicket />
      ) : (
        <>
          <div className="mb-4">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCheckSystem}
            >
              Check System
            </button>
          </div>

          {healthStatus === "Online" && (
            <div className="alert alert-success">
              <h4 className="alert-heading h5">
                System Online
              </h4>

              <p className="mb-0">
                Categories loaded:
              </p>

              <ul className="mb-0 mt-2">
                {categories.map((category) => (
                  <li key={category.id}>{category.name}</li>
                ))}
              </ul>
            </div>
          )}

          {healthStatus === "Offline" && (
            <div className="alert alert-danger">
              <h4 className="alert-heading h5">
                System Offline
              </h4>

              <p className="mb-0">
                Unable to connect to the API.
              </p>
            </div>
          )}

          {!selectedRequester && <RequesterSelection />}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <AppContent />
    </RequesterProvider>
  );
}