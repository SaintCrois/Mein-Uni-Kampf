import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useRequester } from "../context/RequesterContext";
export default function RequesterSelection() {
    const [requesters, setRequesters] = useState([]);
    const { setSelectedRequester } = useRequester();
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch("http://localhost:3000/api/requesters/active")
            .then((res) => {
            if (!res.ok) {
                throw new Error("Failed to fetch requesters");
            }
            return res.json();
        })
            .then((data) => {
            const activeRequesters = (data.data || []).filter((requester) => requester.isActive === true);
            setRequesters(activeRequesters);
            setLoading(false);
        })
            .catch(() => {
            setRequesters([]);
            setLoading(false);
        });
    }, []);
    const handleSelect = (e) => {
        const requester = requesters.find((r) => r.id === Number(e.target.value));
        if (requester) {
            setSelectedRequester(requester);
        }
    };
    if (loading) {
        return _jsx("div", { children: "Loading active requesters..." });
    }
    return (_jsxs("div", { style: {
            maxWidth: "600px",
            margin: "40px auto",
            textAlign: "center",
        }, children: [_jsx("h2", { style: { color: "#006B3C" }, children: "Select Development Requester" }), _jsx("p", { children: "This is for testing only and is not a login screen." }), _jsxs("select", { onChange: handleSelect, defaultValue: "", style: {
                    padding: "10px",
                    width: "100%",
                    marginBottom: "20px",
                }, children: [_jsx("option", { value: "", disabled: true, children: "Select a requester..." }), requesters.map((requester) => (_jsx("option", { value: requester.id, children: requester.fullName }, requester.id)))] }), _jsx("button", { type: "button", style: {
                    backgroundColor: "#006B3C",
                    color: "white",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "4px",
                }, children: "Continue" })] }));
}
