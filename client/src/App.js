import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { checkSystem } from "./api.js";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import RequesterSelection from "./pages/RequesterSelection";
function AppShell() {
    const { selectedRequester, setSelectedRequester } = useRequester();
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
    const [healthStatus, setHealthStatus] = useState("Checking status...");
    const [errorMessage, setErrorMessage] = useState("");
    //Mein Issue 2
    useEffect(() => {
        fetch("http://localhost:3000/api/health")
            .then((res) => res.json())
            .then((data) => setHealthStatus(`Status: ${data.status} | Service: ${data.service}`))
            .catch(() => setHealthStatus("Backend disconnected"));
    }, []);
    if (!selectedRequester) {
        return _jsx(RequesterSelection, {});
    }
    async function handleCheck() {
        // TODO(Issue 4): set loading, call checkSystem(), then either
        //   - success: store categories and show Online + the list, or
        //   - error: show Offline + a useful message.
        setState("loading");
        setErrorMessage("");
        try {
            const data = await checkSystem();
            setCategories(Array.isArray(data) ? data : data?.categories || []);
            setState("success");
        }
        catch (err) {
            setState("error");
            setErrorMessage(err.message || "Failed to fetch category list.");
        }
    }
    return (_jsxs("div", { className: "container py-5", style: { maxWidth: 640 }, children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-4", children: [_jsxs("h1", { className: "h3 mb-0", children: ["TokTickIT ", _jsx("span", { className: "text-success", children: "IT Service Desk" })] }), _jsxs("div", { className: "text-end", children: [_jsx("div", { className: "fw-bold", children: selectedRequester.fullName }), _jsx("button", { type: "button", className: "btn btn-outline-success btn-sm mt-1", onClick: () => setSelectedRequester(null), children: "Change Requester" })] })] }), _jsx("button", { className: "btn btn-success", onClick: handleCheck, disabled: state === "loading", children: state === "loading" ? "Loading…" : "Check System" }), _jsxs("div", { className: "alert alert-info mt-4", role: "alert", children: [_jsx("strong", { children: "API Health:" }), " ", healthStatus] }), state === "success" && (_jsxs("div", { className: "alert alert-success mt-4", role: "alert", children: [_jsx("h4", { className: "alert-heading h5", children: "System Online" }), _jsx("hr", {}), _jsx("p", { className: "mb-2", children: _jsx("strong", { children: "Categories loaded:" }) }), _jsx("ul", { className: "mb-0", children: categories?.map((cat) => (_jsx("li", { children: cat.name }, cat.id))) })] })), state === "error" && (_jsxs("div", { className: "alert alert-danger mt-4", role: "alert", children: [_jsx("h4", { className: "alert-heading h5", children: "System Offline" }), _jsx("p", { className: "mb-0", children: errorMessage })] }))] }));
}
export default function App() {
    return (_jsx(RequesterProvider, { children: _jsx(AppShell, {}) }));
}
