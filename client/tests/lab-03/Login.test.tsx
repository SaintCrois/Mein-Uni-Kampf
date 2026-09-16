import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../../src/pages/Login";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UI-LOGIN-01: Login Component", () => {
  it("renders email and password inputs and a submit button", () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows error feedback when email or password is empty", () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText(/please enter both email and password/i),
    ).toBeInTheDocument();
  });

  it("displays loading state 'Signing in...' and disables button while logging in", async () => {
    let resolveLogin: (value: any) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    vi.spyOn(api, "login").mockReturnValue(pendingPromise as any);

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "narin.chaiyo@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "Password123!" },
    });

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByRole("button", { name: /signing in\.\.\./i }),
    ).toBeDisabled();

    // Resolve login
    resolveLogin({
      user: {
        id: 1,
        name: "Narin Chaiyo",
        email: "narin.chaiyo@example.com",
        role: "REQUESTER",
        mustChangePassword: false,
      },
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /signing in\.\.\./i }),
      ).not.toBeInTheDocument();
    });
  });

  it("displays 'Invalid email or password' error banner when authentication fails", async () => {
    vi.spyOn(api, "login").mockRejectedValue(
      new Error("Invalid email or password"),
    );

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "narin.chaiyo@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "WrongPassword!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("Invalid email or password"),
    ).toBeInTheDocument();
  });

  it("calls onSuccess callback upon successful login", async () => {
    const onSuccess = vi.fn();

    vi.spyOn(api, "login").mockResolvedValue({
      user: {
        id: 1,
        name: "Narin Chaiyo",
        email: "narin.chaiyo@example.com",
        role: "REQUESTER",
        mustChangePassword: false,
      },
    });

    render(
      <AuthProvider>
        <Login onSuccess={onSuccess} />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "narin.chaiyo@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});

