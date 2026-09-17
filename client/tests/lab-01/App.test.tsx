import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/App.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("App", () => {
  it("renders the TokTickIT application heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: /TokTickIT IT Service Desk/i }),
    ).toBeInTheDocument();
  });

  it("shows the sign-in screen to unauthenticated visitors", () => {
    render(<App />);

    expect(screen.getByRole("heading", { level: 2, name: "TokTickIT" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^sign in$/i })).toHaveLength(2);
  });

  it("shows credentials inputs on the unauthenticated screen", () => {
    render(<App />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("does not expose the obsolete development requester selector", () => {
    render(<App />);

    expect(screen.queryByText("Select Development Requester")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change Requester" })).not.toBeInTheDocument();
  });
});
