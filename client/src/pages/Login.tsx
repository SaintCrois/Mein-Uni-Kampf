import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

interface LoginProps {
  onSuccess?: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email.trim(), password);
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Invalid email or password";
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
          maxWidth: "440px",
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
          <h2 className="h4 mb-0">TokTickIT</h2>
          <small style={{ color: "#EAF6EF" }}>IT Service Desk Login</small>
        </div>

        <div className="card-body p-4">
          {errorMessage && (
            <div
              className="alert alert-danger py-2"
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-semibold">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

