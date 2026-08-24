import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RequesterSelection from "../../src/pages/RequesterSelection";
import { RequesterProvider } from "../../src/context/RequesterContext";

describe("Requester Selection Screen", () => {
  it("loads active requesters and excludes inactive requesters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 1,
              fullName: "Narin Chaiyo",
              email: "narin.chaiyo@example.com",
              isActive: true,
            },
            {
              id: 2,
              fullName: "Pimchanok Rattanakul",
              email: "pimchanok.rattanakul@example.com",
              isActive: true,
            },
            {
              id: 3,
              fullName: "Inactive Requester",
              email: "inactive.requester@example.com",
              isActive: false,
            },
          ],
        }),
      })
    );

    render(
      <RequesterProvider>
        <RequesterSelection />
      </RequesterProvider>
    );

    expect(
      await screen.findByText("Select Development Requester")
    ).toBeInTheDocument();

    expect(screen.getByText("Narin Chaiyo")).toBeInTheDocument();
    expect(
      screen.getByText("Pimchanok Rattanakul")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Inactive Requester")
    ).not.toBeInTheDocument();
  });
});