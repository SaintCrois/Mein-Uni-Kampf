import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("App", () => {
  it("renders the TokTickIT heading", () => {
    render(<App />);

    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
  });

  it("shows Online and the seeded categories on success", async () => {
    const mockCategories = [
      { id: 1, name: "Account and Access" },
      { id: 2, name: "Hardware" },
      { id: 3, name: "Software" },
      { id: 4, name: "Network" },
    ];

    vi.spyOn(api, "checkSystem").mockResolvedValue(mockCategories as any);

    render(<App />);

    const button = screen.getByText(/check system/i);

    fireEvent.click(button);

    expect(await screen.findByText(/online/i)).toBeInTheDocument();
    expect(screen.getByText(/account and access/i)).toBeInTheDocument();
    expect(screen.getByText(/hardware/i)).toBeInTheDocument();
    expect(screen.getByText(/software/i)).toBeInTheDocument();
    expect(screen.getByText(/network/i)).toBeInTheDocument();
  });

  it("shows an Offline error message when the API is unavailable", async () => {
    vi.spyOn(api, "checkSystem").mockRejectedValue(
      new Error("Failed to fetch category list."),
    );

    render(<App />);

    const button = screen.getByText(/check system/i);

    fireEvent.click(button);

    expect(await screen.findByText(/offline/i)).toBeInTheDocument();
  });

  it("shows Change Requester after a requester is selected", async () => {
    vi.spyOn(api, "getActiveRequesters").mockResolvedValue([
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
    ]);

    render(<App />);

    expect(
      await screen.findByText("Select Development Requester"),
    ).toBeInTheDocument();

    const requesterSelect = screen.getByRole("combobox", {
      name: /Development Requester/,
    });

    fireEvent.change(requesterSelect, {
      target: { value: "1" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue",
      }),
    );

    expect(
      await screen.findByText("Narin Chaiyo"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Change Requester",
      }),
    ).toBeInTheDocument();
  });
});
