import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import UserManagement from "../../src/pages/UserManagement";
import * as api from "../../src/api";
import * as auth from "../../src/context/AuthContext";

const users: api.ManagedUser[] = [{ id: 1, name: "System Administrator", email: "admin@example.com", role: "ADMINISTRATOR", isActive: true, mustChangePassword: false, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z" }];
afterEach(() => vi.restoreAllMocks());
function renderScreen() {
  vi.spyOn(auth, "useAuth").mockReturnValue({ user: users[0], isLoading: false, login: vi.fn(), logout: vi.fn(), changePassword: vi.fn(), setUser: vi.fn() });
  vi.spyOn(api, "getUsers").mockResolvedValue(users);
  return render(<UserManagement />);
}
describe("UI-ADMIN-01: User Management", () => {
  it("renders users and search/filter controls", async () => {
    renderScreen(); expect(await screen.findByText("System Administrator")).toBeInTheDocument();
    expect(screen.getByLabelText(/search users/i)).toBeInTheDocument(); expect(screen.getByLabelText(/^role$/i)).toBeInTheDocument();
  });
  it("opens the create modal and submits valid user data", async () => {
    const create = vi.spyOn(api, "createUser").mockResolvedValue({ ...users[0], id: 2, email: "new@example.com", name: "New User", role: "REQUESTER", mustChangePassword: true });
    renderScreen(); await screen.findByText("System Administrator"); fireEvent.click(screen.getByRole("button", { name: /create new user/i }));
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "New User" } }); fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "new@example.com" } }); fireEvent.change(screen.getByLabelText(/initial password/i), { target: { value: "Password123!" } }); fireEvent.click(screen.getByRole("button", { name: /save user/i }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: "New User", role: "REQUESTER" })));
  });
});
