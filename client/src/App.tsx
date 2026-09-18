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
import { useEffect } from "react";
import { checkSystem } from "./api";
import StaffTickets from "./pages/StaffTickets";
import StaffTicketDetail from "./pages/StaffTicketDetail";
import UserManagement from "./pages/UserManagement";

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
    | "staff-tickets"
  | "staff-ticket-detail"
    | "admin-users"
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

  function primaryPage() {
    if (user?.role === "IT_STAFF") return "staff-tickets";
    if (user?.role === "ADMINISTRATOR") return "admin-users";
    return "my-tickets";
  }

  useEffect(() => {
    if (user && !user.mustChangePassword && page === "home") setPage(primaryPage());
  }, [user]);

  function handleOpenTicket(ticketId: number) {
    setSelectedTicketId(ticketId);
    setPage(
      user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR"
        ? "staff-ticket-detail"
        : "ticket-detail",
    );
  }

  async function handleLogout() {
    try {
      await logout();
      setSelectedRequester(null);
      setPage("login");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }

  const effectiveRequester = user?.role === "REQUESTER"
    ? { id: user.id, fullName: user.name, email: user.email, isActive: true }
    : null;

  return (
    <div className="container py-4 app-shell">
      <header
        className="app-header mb-4 p-3 rounded"
      >
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div className="app-header__identity">
            <h1 className="h3 mb-1">
              TokTickIT{" "}
              <span style={{ color: "#EAF6EF" }}>IT Service Desk</span>
            </h1>

            {user ? (
              <div className="fw-bold d-flex flex-wrap align-items-center gap-2">
                <span>{user.name}</span>
                {user.role === "REQUESTER" && (
                  <span className="badge badge-role-requester">Requester</span>
                )}
                {user.role === "IT_STAFF" && (
                  <span className="badge badge-role-staff">IT Staff</span>
                )}
                {user.role === "ADMINISTRATOR" && (
                  <span className="badge badge-role-admin">Administrator</span>
                )}
              </div>
            ) : selectedRequester ? (
              <div className="fw-bold">{selectedRequester.fullName}</div>
            ) : null}
          </div>

          <div className="app-header__actions d-flex flex-column flex-sm-row align-items-sm-center gap-2">
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
                {user.role === "IT_STAFF" && (
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setPage("staff-tickets")}>
                    Ticket Queue
                  </button>
                )}
                {user.role === "ADMINISTRATOR" && (
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setPage("admin-users")}>
                    User Management
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogout}
                >
                  Logout
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
      ) : !user ? (
        <Login onSuccess={() => setPage("home")} />
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
        selectedTicketId !== null ? (
        <TicketDetail
          ticketId={selectedTicketId}
          onBack={() => {
            if (user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR") {
              setPage("staff-tickets");
            } else {
              setPage("my-tickets");
            }
          }}
        />
      ) : page === "staff-ticket-detail" &&
        selectedTicketId !== null &&
        (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") ? (
        <StaffTicketDetail
          ticketId={selectedTicketId}
          onBack={() => setPage("staff-tickets")}
        />
      ) : page === "staff-tickets" ? (
        user.role === "IT_STAFF" || user.role === "ADMINISTRATOR" ? (
          <StaffTickets onOpenTicket={handleOpenTicket} />
        ) : (
          <section className="card shadow-sm border-danger">
            <div className="card-header bg-danger text-white">
              <h2 className="h5 mb-0">Access Forbidden</h2>
            </div>
            <div className="card-body">
              <p className="text-danger mb-0">
                Access Denied: You do not have permission to view the IT Staff Ticket Queue.
              </p>
            </div>
          </section>
        )
      ) : page === "admin-users" && user.role === "ADMINISTRATOR" ? (
        <UserManagement />
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
