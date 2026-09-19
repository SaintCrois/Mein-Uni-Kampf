import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

interface ChangePasswordProps {
  onSuccess?: () => void;
}

export default function ChangePassword({ onSuccess }: ChangePasswordProps) {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage("New password must be different from the current password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage("Password changed successfully!");
      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update password.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="d-flex justify-content-center align-items-center py-5"
      style={{ minHeight: "70vh" }}
    >
      <div
        className="card shadow-sm w-100"
        style={{
          maxWidth: "480px",
          border: "1px solid #DEE2E6",
        }}
      >
        <div
          className="card-header text-center py-3"
          style={{
            backgroundColor: "#006B3C",
            color: "white",
          }}
        >
          <h2 className="h4 mb-0">Set New Password</h2>
          <small style={{ color: "#EAF6EF" }}>Mandatory Security Update</small>
        </div>

        <div className="card-body p-4">
          <div
            className="alert py-2 mb-3"
            style={{
              backgroundColor: "#FEF3C7",
              color: "#92400E",
              border: "1px solid #FCD34D",
            }}
            role="alert"
          >
            Your account was created with an initial password. Please set a new
            password to continue.
          </div>

          {errorMessage && (
            <div
              className="alert alert-danger py-2 mb-3"
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success py-2 mb-3" role="alert">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label
                htmlFor="currentPassword"
                className="form-label fw-semibold"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                className="form-control"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label fw-semibold">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                className="form-control"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <div className="form-text text-muted">
                Must be at least 8 characters in length.
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="form-label fw-semibold"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-success w-100 py-2 fw-semibold"
              style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
              disabled={isLoading}
            >
              {isLoading
                ? "Updating..."
                : "Update Password and Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

