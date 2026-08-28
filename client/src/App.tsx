import { useState } from "react";
import {
  RequesterProvider,
  useRequester,
} from "./context/RequesterContext";
import RequesterSelection from "./pages/RequesterSelection";
import CreateTicket from "./pages/CreateTicket";
import MyTickets from "./pages/MyTickets";
import TicketDetail from "./pages/TicketDetail";
import { checkSystem } from "./api";



function AppContent() {
  const {
    selectedRequester,
    setSelectedRequester,
  } = useRequester();

  const [page, setPage] = useState<
    "home" | "my-tickets" | "ticket-detail" | "create-ticket" | "change-requester"
  >("home");

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTicketId, setSelectedTicketId] =
    useState<number | null>(null);


  const [healthStatus, setHealthStatus] =
    useState("Not checked");

  const [categories, setCategories] = useState<
    { id: number; name: string }[]
  >([]);

  async function handleCheckSystem() {
    try {
      const result = await checkSystem();

      setHealthStatus("Online");

      // Supports both the normal API result
      // and the test mock.
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
              <span style={{ color: "#EAF6EF" }}>
                IT Service Desk
              </span>
            </h1>

            {selectedRequester && (
              <div className="fw-bold">
                {selectedRequester.fullName}
              </div>
            )}
          </div>

          {selectedRequester && (
            <div className="d-flex flex-column flex-sm-row gap-2">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setPage("my-tickets")}
              >
                My Tickets
              </button>

              <button
                type="button"
                className="btn btn-light"
                onClick={() => setPage("create-ticket")}
              >
                Create Ticket
              </button>

              <button
                type="button"
                className="btn btn-outline-light"
                onClick={handleChangeRequester}
              >
                Change Requester
              </button>
            </div>
          )}
        </div>
      </header>


      {page === "create-ticket" &&
      selectedRequester ? (
        <CreateTicket
          onTicketCreated={() => {
            setRefreshKey((current) => current + 1);
            setPage("my-tickets");
          }}
        />
      ) : page === "my-tickets" &&
      selectedRequester ? (
        <MyTickets
          onOpenTicket={handleOpenTicket}
          onCreateTicket={() => setPage("create-ticket")}
          refreshKey={refreshKey}
        />

      ) : page === "ticket-detail" &&
      selectedRequester &&
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

          <RequesterSelection
            onRequesterSelected={
              handleRequesterSelected
            }
          />
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
              <h4 className="alert-heading h5">
                System Online
              </h4>

              <p className="mb-0">
                Categories loaded:
              </p>

              <ul className="mb-0 mt-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    {category.name}
                  </li>
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

          {!selectedRequester && (
            <RequesterSelection
              onRequesterSelected={
                handleRequesterSelected
              }
            />
          )}
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
