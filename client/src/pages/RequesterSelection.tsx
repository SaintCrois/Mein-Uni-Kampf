import React, { useEffect, useState } from "react";
import { useRequester } from "../context/RequesterContext";

type Requester = {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
};

export default function RequesterSelection() {
  const [requesters, setRequesters] = useState<Requester[]>([]);
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
        const activeRequesters = (data.data || []).filter(
          (requester: Requester) => requester.isActive === true
        );

        setRequesters(activeRequesters);
        setLoading(false);
      })
      .catch(() => {
        setRequesters([]);
        setLoading(false);
      });
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const requester = requesters.find(
      (r) => r.id === Number(e.target.value)
    );

    if (requester) {
      setSelectedRequester(requester);
    }
  };

  if (loading) {
    return <div>Loading active requesters...</div>;
  }

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#006B3C" }}>
        Select Development Requester
      </h2>

      <p>
        This is for testing only and is not a login screen.
      </p>

      <select
        onChange={handleSelect}
        defaultValue=""
        style={{
          padding: "10px",
          width: "100%",
          marginBottom: "20px",
        }}
      >
        <option value="" disabled>
          Select a requester...
        </option>

        {requesters.map((requester) => (
          <option key={requester.id} value={requester.id}>
            {requester.fullName}
          </option>
        ))}
      </select>

      <button
        type="button"
        style={{
          backgroundColor: "#006B3C",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Continue
      </button>
    </div>
  );
}