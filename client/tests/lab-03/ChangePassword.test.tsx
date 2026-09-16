import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChangePassword from "../../src/pages/ChangePassword";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("UI-PASS-01: Change Password Component", () => {
  it("renders current password, new password, confirm password inputs, and warning notice", () => {
    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>,
    );

    expect(
      screen.getByText(/your account was created with an initial password/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm new password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password and continue/i }),
    ).toBeInTheDocument();
  });

  it("enforces minimum 8 characters for the new password", () => {
    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/^current password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/^confirm new password/i), {
      target: { value: "short" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /update password and continue/i }),
    );

    expect(
      screen.getByText(/new password must be at least 8 characters/i),
    ).toBeInTheDocument();
  });

  it("validates that new password and confirm password match", () => {
    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/^current password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "Password456!" },
    });
    fireEvent.change(screen.getByLabelText(/^confirm new password/i), {
      target: { value: "MismatchPassword789!" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /update password and continue/i }),
    );

    expect(
      screen.getByText(/new passwords do not match/i),
    ).toBeInTheDocument();
  });

  it("prevents changing password to the same password", () => {
    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/^current password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/^confirm new password/i), {
      target: { value: "Password123!" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /update password and continue/i }),
    );

    expect(
      screen.getByText(/new password must be different from the current password/i),
    ).toBeInTheDocument();
  });

  it("submits valid password change and displays success feedback", async () => {
    vi.spyOn(api, "changePassword").mockResolvedValue();

    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/^current password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "FreshPassword2026!" },
    });
    fireEvent.change(screen.getByLabelText(/^confirm new password/i), {
      target: { value: "FreshPassword2026!" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /update password and continue/i }),
    );

    expect(
      await screen.findByText(/password changed successfully/i),
    ).toBeInTheDocument();
  });
});

