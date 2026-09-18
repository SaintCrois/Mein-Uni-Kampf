import { useEffect, useState, type FormEvent } from "react";
import { createUser, getUsers, resetUserPassword, updateUser, type ManagedUser, type User, type UserInput } from "../api";
import { useAuth } from "../context/AuthContext";

const roles: Array<{ value: User["role"]; label: string }> = [
  { value: "REQUESTER", label: "Requester" }, { value: "IT_STAFF", label: "IT Staff" }, { value: "ADMINISTRATOR", label: "Administrator" },
];
type FormData = UserInput & { initialPassword: string };
const emptyForm = (): FormData => ({ name: "", email: "", role: "REQUESTER", isActive: true, initialPassword: "" });
const roleLabel = (role: User["role"]) => roles.find((item) => item.value === role)?.label ?? role;

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<FormData>(emptyForm());
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try { setUsers(await getUsers(search, roleFilter)); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to load users."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 200);
    return () => window.clearTimeout(timer);
  }, [search, roleFilter]);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => setForm((old) => ({ ...old, [key]: value }));
  const activeAdmins = users.filter((item) => item.role === "ADMINISTRATOR" && item.isActive).length;
  const closeModal = () => { setModalOpen(false); setEditing(null); setResetting(false); setForm(emptyForm()); };
  const openCreate = () => { closeModal(); setModalOpen(true); setError(""); };
  const openEdit = (item: ManagedUser) => { setEditing(item); setModalOpen(true); setResetting(false); setError(""); setForm({ name: item.name, email: item.email, role: item.role, isActive: item.isActive, initialPassword: "" }); };

  async function save(event: FormEvent) {
    event.preventDefault(); setError(""); setSuccess("");
    if (!form.name.trim() || !form.email.trim() || (!editing || resetting) && form.initialPassword.length < 8) {
      setError("Name, email, and an initial password of at least 8 characters are required."); return;
    }
    setBusy(true);
    try {
      if (editing) {
        await updateUser(editing.id, form);
        if (resetting) await resetUserPassword(editing.id, form.initialPassword);
        setSuccess(resetting ? "User updated and initial password set." : "User updated successfully.");
      } else {
        await createUser(form); setSuccess("User created successfully.");
      }
      closeModal(); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save user."); }
    finally { setBusy(false); }
  }

  return <section className="card shadow-sm"><div className="card-body">
    <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4"><div><h2 className="h4 mb-1">User Management</h2><p className="text-muted mb-0">{users.length} user{users.length === 1 ? "" : "s"}</p></div><button className="btn btn-primary" type="button" onClick={openCreate}>Create New User</button></div>
    {success && <div className="alert alert-success" role="status">{success}</div>}
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <div className="row g-3 mb-4"><div className="col-md-8"><label className="form-label" htmlFor="user-search">Search users</label><input id="user-search" className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" /></div><div className="col-md-4"><label className="form-label" htmlFor="role-filter">Role</label><select id="role-filter" className="form-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All Roles</option>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></div></div>
    {loading ? <p className="text-muted mb-0">Loading users…</p> : users.length === 0 ? <div className="alert alert-light border mb-0">{search || roleFilter ? "No users match your search." : "No users have been created yet."}</div> : <div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.email}</td><td><span className="badge bg-secondary">{roleLabel(item.role)}</span></td><td><span className={`badge ${item.isActive ? "bg-success" : "bg-secondary"}`}>{item.isActive ? "Active" : "Inactive"}</span></td><td>{new Date(item.createdAt).toLocaleDateString()}</td><td><button className="btn btn-outline-primary btn-sm" type="button" onClick={() => openEdit(item)}>Edit</button></td></tr>)}</tbody></table></div>}
    {modalOpen && <div className="modal d-block" role="dialog" aria-modal="true"><div className="modal-dialog"><form className="modal-content" onSubmit={save}><div className="modal-header"><h3 className="h5 modal-title">{editing ? "Edit User" : "Create New User"}</h3><button type="button" className="btn-close" aria-label="Close" onClick={closeModal} /></div><div className="modal-body"><label className="form-label" htmlFor="user-name">Full Name</label><input required id="user-name" className="form-control mb-3" value={form.name} onChange={(event) => setField("name", event.target.value)} /><label className="form-label" htmlFor="user-email">Email Address</label><input required type="email" id="user-email" className="form-control mb-3" value={form.email} onChange={(event) => setField("email", event.target.value)} /><label className="form-label" htmlFor="user-role">Role</label><select id="user-role" className="form-select mb-3" value={form.role} disabled={!!editing && editing.role === "ADMINISTRATOR" && editing.isActive && activeAdmins <= 1} onChange={(event) => setField("role", event.target.value as User["role"])}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select><div className="form-check mb-3"><input id="user-active" className="form-check-input" type="checkbox" checked={form.isActive} disabled={editing?.id === currentUser?.id || (!!editing && editing.role === "ADMINISTRATOR" && editing.isActive && activeAdmins <= 1)} onChange={(event) => setField("isActive", event.target.checked)} /><label className="form-check-label" htmlFor="user-active">Active account</label>{editing?.id === currentUser?.id && <div className="form-text">You cannot deactivate your own account.</div>}</div>{(!editing || resetting) && <><label className="form-label" htmlFor="initial-password">Initial Password</label><input required type="password" minLength={8} id="initial-password" className="form-control" value={form.initialPassword} onChange={(event) => setField("initialPassword", event.target.value)} /><div className="form-text">The user will be required to change it on next login.</div></>}{editing && !resetting && <button type="button" className="btn btn-outline-secondary mt-2" onClick={() => setResetting(true)}>Set New Initial Password</button>}</div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button><button disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Save User"}</button></div></form></div></div>}
  </div></section>;
}
