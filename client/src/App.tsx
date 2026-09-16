import { useState } from "react";
import {
  RequesterProvider,
  useRequester,
} from "./context/RequesterContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RequesterSelection from "./pages/RequesterSelection";
import CreateTicket from "./pages/CreateTicket";
import MyTickets from "./pages/MyTickets";
import TicketDetail from "./pages/TicketDetail";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import { checkSystem } from "./api";

function AppContent() {
  const {
    selectedRequester,
    setSelectedRequester,
  } = useRequester();

  const { user, logout } = useAuth();

  const [page, setPage] = useState<
    | "home"
    | "login"
    | "change-password"
    | "my-tickets"
    | "ticket-detail"
    | "create-ticket"
    | "change-requester"
  >("home");

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const [healthStatus, setHealthStatus] = useState("Not checked");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  async function handleCheckSystem() {
    try {
      const result = await checkSystem();
      setHealthStatus("Online");

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

  function handleChangeRequester() {
    setPage("change-requester");
  }

  function handleCancelChangeRequester() {
    setPage("home");
  }

  function handleRequesterSelected() {
    setPage("home");
  }

  function handleOpenTicket(ticketId: number) {
    setSelectedTicketId(ticketId);
    setPage("ticket-detail");
  }

  async function handleLogout() {
    try {
      await logout();
      setSelectedRequester(null);
      setPage("home");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }

  // Active requester context: authenticated user or simulated dev requester
  const effectiveRequester = user
    ? {
        id: user.id,
        fullName: user.name,
        email: user.email,
        isActive: true,
      }
    : selectedRequester;

  return (
    <div className="container py-4">
      <header
        className="mb-4 p-3 rounded"
        style={{
          backgroundColor: "#006B3C",
          color: "white",
        }}
      >
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h1 className="h3 mb-1">
              TokTickIT{" "}
              <span style={{ color: "#EAF6EF" }}>IT Service Desk</span>
            </h1>

            {user ? (
              <div className="fw-bold d-flex align-items-center gap-2">
                <span>{user.name}</span>
                {user.role === "REQUESTER" && (
                  <span className="badge bg-secondary">Requester</span>
                )}
                {user.role === "IT_STAFF" && (
                  <span className="badge bg-primary">IT Staff</span>
                )}
                {user.role === "ADMINISTRATOR" && (
                  <span className="badge bg-dark">Administrator</span>
                )}
              </div>
            ) : selectedRequester ? (
              <div className="fw-bold">{selectedRequester.fullName}</div>
            ) : null}
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2">
            {user ? (
              <>
                {user.role === "REQUESTER" && (
                  <>
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => setPage("my-tickets")}
                    >
                      My Tickets
                    </button>
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={() => setPage("create-ticket")}
                    >
                      Create Ticket
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : selectedRequester ? (
              <>
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => setPage("my-tickets")}
                >
                  My Tickets
                </button>
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => setPage("create-ticket")}
                >
                  Create Ticket
                </button>
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm"
                  onClick={handleChangeRequester}
                >
                  Change Requester
                </button>
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => setPage("login")}
                >
                  Sign In
                </button>
              </>
            ) : (
              page !== "login" && (
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => setPage("login")}
                >
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Mandatory password change gate */}
      {user?.mustChangePassword ? (
        <ChangePassword onSuccess={() => setPage("home")} />
      ) : page === "login" ? (
        <Login onSuccess={() => setPage("home")} />
      ) : page === "change-password" ? (
        <ChangePassword onSuccess={() => setPage("home")} />
      ) : page === "create-ticket" && effectiveRequester ? (
        <CreateTicket
          onTicketCreated={() => {
            setRefreshKey((current) => current + 1);
            setPage("my-tickets");
          }}
        />
      ) : page === "my-tickets" && effectiveRequester ? (
        <MyTickets
          onOpenTicket={handleOpenTicket}
          onCreateTicket={() => setPage("create-ticket")}
          refreshKey={refreshKey}
        />
      ) : page === "ticket-detail" &&
        effectiveRequester &&
        selectedTicketId !== null ? (
        <TicketDetail
          ticketId={selectedTicketId}
          onBack={() => setPage("my-tickets")}
        />
      ) : page === "change-requester" ? (
        <>
          <div className="d-flex justify-content-end mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleCancelChangeRequester}
            >
              Cancel
            </button>
          </div>
          <RequesterSelection onRequesterSelected={handleRequesterSelected} />
        </>
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
              <h4 className="alert-heading h5">System Online</h4>
              <p className="mb-0">Categories loaded:</p>
              <ul className="mb-0 mt-2">
                {categories.map((category) => (
                  <li key={category.id}>{category.name}</li>
                ))}
              </ul>
            </div>
          )}

          {healthStatus === "Offline" && (
            <div className="alert alert-danger">
              <h4 className="alert-heading h5">System Offline</h4>
              <p className="mb-0">Unable to connect to the API.</p>
            </div>
          )}

          {!effectiveRequester && !user && (
            <RequesterSelection onRequesterSelected={handleRequesterSelected} />
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RequesterProvider>
        <AppContent />
      </RequesterProvider>
    </AuthProvider>
  );
}
