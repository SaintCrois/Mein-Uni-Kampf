const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthResponse = await fetch(`${API_URL}/api/health`);

  if (!healthResponse.ok) {
    throw new Error("Health check failed.");
  }

  const categoriesResponse = await fetch(`${API_URL}/api/categories`, {
    credentials: "include",
  });

  if (!categoriesResponse.ok) {
    throw new Error("Failed to fetch category list.");
  }

  const categories = await categoriesResponse.json();

  return {
    online: true,
    categories,
  };
}

export interface Requester {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
}

export async function getActiveRequesters(): Promise<Requester[]> {
  const response = await fetch(`${API_URL}/api/requesters/active`);

  if (!response.ok) {
    throw new Error("Failed to fetch active requesters.");
  }

  const data = await response.json();
  return data.data ?? data;
}

export interface CreateTicketAttachment {
  file: File;
}

export interface CreateTicketInput {
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  requestedPriorityId: number;
  description: string;
  attachments?: File[];
}

export interface CreateTicketResponse {
  id: number;
  ticketNumber: string;
  createdAt?: string;
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriorityId?: number;
  requestedPriority?: string;
  status?: string;
  currentStatus?: string;
}

export async function createTicket(
  input: CreateTicketInput,
): Promise<CreateTicketResponse> {
  const response = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Failed to create ticket.");
  }

  return response.json();
}

export async function uploadTicketAttachments(
  ticketId: number,
  _requesterId: number,
  files: File[],
): Promise<void> {
  if (files.length === 0) return;

  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch(
    `${API_URL}/api/tickets/${ticketId}/attachments`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to upload attachments.");
  }
}

export interface ReferenceItem {
  id: number;
  name: string;
}

export async function getCategories(): Promise<ReferenceItem[]> {
  const response = await fetch(`${API_URL}/api/categories`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories.");
  }

  return response.json();
}

export async function getRelatedSystems(): Promise<ReferenceItem[]> {
  const response = await fetch(`${API_URL}/api/related-systems`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch related systems.");
  }

  return response.json();
}

export async function getPriorities(): Promise<ReferenceItem[]> {
  const response = await fetch(`${API_URL}/api/priorities`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch priorities.");
  }

  return response.json();
}

export interface MyTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  category: {
    id: number;
    name: string;
  };
  requestedPriority: {
    id: number;
    name: string;
  };
  currentStatus: {
    id: number;
    name: string;
  };
  owner?: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
}

export interface MyTicketsResponse {
  data: MyTicket[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export async function getMyTickets(
  params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    priority?: string;
    categoryId?: number;
    sortBy?: string;
    sortOrder?: string;
  }
): Promise<MyTicketsResponse> {
  const urlParams = new URLSearchParams();
  if (params?.page) urlParams.set("page", String(params.page));
  if (params?.pageSize) urlParams.set("pageSize", String(params.pageSize));
  if (params?.search) urlParams.set("search", params.search);
  if (params?.status) urlParams.set("status", params.status);
  if (params?.priority) urlParams.set("priority", params.priority);
  if (params?.categoryId) urlParams.set("categoryId", String(params.categoryId));
  if (params?.sortBy) urlParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) urlParams.set("sortOrder", params.sortOrder);

  const response = await fetch(`${API_URL}/api/tickets?${urlParams.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.error || "Failed to fetch tickets.",
    );
  }

  const data = await response.json();

  return {
    data: data.data ?? data.items ?? [],
    page: data.page ?? 1,
    pageSize: data.pageSize ?? 10,
    totalItems: data.totalItems ?? 0,
    totalPages: data.totalPages ?? 1,
  };
}


export async function markResolvedIndicator(
  ticketId: number,
  resolved: boolean
): Promise<{ id: number; requesterResolvedIndicator: boolean }> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/resolve-indicator`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolved }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to update resolved indicator.");
  }
  return response.json();
}

export interface TicketAttachment {
  id: number;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  status: "ACTIVE" | "REMOVED";
  removalReason: string | null;
  removedAt: string | null;
  uploadedAt: string;
}

export interface TicketDetail {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  category: {
    id: number;
    name: string;
  };
  relatedSystem: {
    id: number;
    name: string;
  };
  requestedPriority: {
    id: number;
    name: string;
  };
  currentStatus: {
    id: number;
    name: string;
  };
  itPriority?: {
    id: number;
    name: string;
  } | null;
  owner?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
  requester?: {
    id: number;
    name: string;
    email: string;
    role?: string;
  } | null;
  requesterResolvedIndicator?: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: TicketAttachment[];
}

export async function getTicketDetail(
  ticketId: number,
  _requesterId: number,
): Promise<TicketDetail> {
  const response = await fetch(
    `${API_URL}/api/tickets/${ticketId}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.error || "Failed to fetch ticket details.",
    );
  }

  return response.json();
}

export async function getStaffTicketDetail(ticketId: number): Promise<TicketDetail> {
  const response = await fetch(`${API_URL}/api/staff/tickets/${ticketId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to fetch staff ticket details.");
  }

  return response.json();
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  mustChangePassword: boolean;
}

export interface ManagedUser extends User {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserInput {
  name: string;
  email: string;
  role: User["role"];
  isActive: boolean;
}

async function adminRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}/api/admin${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "User management request failed.");
  return data;
}

export async function getUsers(search = "", role = ""): Promise<ManagedUser[]> {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (role) params.set("role", role);
  const data = await adminRequest(`/users?${params.toString()}`);
  return data.data ?? data;
}

export async function createUser(input: UserInput & { initialPassword: string }): Promise<ManagedUser> {
  return adminRequest("/users", { method: "POST", body: JSON.stringify(input) });
}

export async function updateUser(id: number, input: UserInput): Promise<ManagedUser> {
  return adminRequest(`/users/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function resetUserPassword(id: number, initialPassword: string): Promise<void> {
  await adminRequest(`/users/${id}/reset-password`, { method: "POST", body: JSON.stringify({ initialPassword }) });
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User }> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Invalid email or password");
  }

  return response.json();
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to log out.");
  }
}

export async function getMe(): Promise<{ user: User }> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Authentication required");
  }

  return response.json();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to change password.");
  }
}

export interface StaffTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  createdAt: string;

  category: {
    id: number;
    name: string;
  };

  requestedPriority: {
    id: number;
    name: string;
  };

  itPriority: {
    id: number;
    name: string;
  } | null;

  currentStatus: {
    id: number;
    name: string;
  };

  owner: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;

  requester: {
    id: number;
    name: string;
    email: string;
  };
}

export interface StaffTicketResponse {
  data?: StaffTicket[];
  items?: StaffTicket[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface StaffTicketFilters {
  search?: string;
  status?: string;
  categoryId?: number;
  itPriority?: string;
  requestedPriority?: string;
  ownership?: "all" | "unassigned" | "mine";
  sortBy?: "createdAt" | "ticketNumber";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function getStaffTickets(
  filters: StaffTicketFilters = {},
): Promise<StaffTicketResponse> {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status?.trim()) {
    params.set("status", filters.status.trim());
  }

  if (filters.categoryId !== undefined) {
    params.set("categoryId", String(filters.categoryId));
  }
  
  if (filters.requestedPriority?.trim()) {
    params.set(
      "requestedPriority",
      filters.requestedPriority.trim(),
    );
  }

  if (filters.itPriority?.trim()) {
    params.set("itPriority", filters.itPriority.trim());
  }

  if (filters.ownership) {
    params.set("ownership", filters.ownership);
  }

  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }

  if (filters.sortOrder) {
    params.set("sortOrder", filters.sortOrder);
  }

  if (filters.page !== undefined) {
    params.set("page", String(filters.page));
  }

  if (filters.pageSize !== undefined) {
    params.set("pageSize", String(filters.pageSize));
  }

  const response = await fetch(
    `${API_URL}/api/staff/tickets?${params.toString()}`,
    {
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error || "Failed to fetch staff ticket queue.",
    );
  }

  return {
    ...data,
    data: Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.items)
        ? data.items
        : [],
  };
}

export interface CommentAuthor {
  id: number;
  name: string;
  role: string;
}

export interface PublicComment {
  id: number;
  author: CommentAuthor;
  content: string;
  createdAt: string;
}

export interface InternalNote {
  id: number;
  author: CommentAuthor;
  content: string;
  createdAt: string;
}

export interface StaffAssignee {
  id: number;
  name: string;
  email: string;
  role: string;
}

export async function getStaffAssignees(): Promise<StaffAssignee[]> {
  const response = await fetch(`${API_URL}/api/staff/assignees`, {
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to fetch assignees.");
  }

  const result = await response.json();
  return result.data ?? [];
}

export async function claimTicket(ticketId: number): Promise<TicketDetail> {
  const response = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/claim`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to claim ticket.");
  }

  return response.json();
}

export async function assignTicket(
  ticketId: number,
  ownerId: number,
): Promise<TicketDetail> {
  const response = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/assign`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ownerId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to assign ticket.");
  }

  return response.json();
}

export async function updateTicketPriority(
  ticketId: number,
  itPriority: string,
): Promise<TicketDetail> {
  const response = await fetch(
    `${API_URL}/api/staff/tickets/${ticketId}/priority`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itPriority }),
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to update ticket priority.");
  }

  return response.json();
}

export async function updateTicketStatus(
  ticketId: number,
  status: string,
): Promise<TicketDetail> {
  const response = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to update ticket status.");
  }

  return response.json();
}

export async function getPublicComments(
  ticketId: number,
): Promise<PublicComment[]> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to fetch public comments.");
  }

  const result = await response.json();
  return Array.isArray(result) ? result : (result.data ?? []);
}

export async function createPublicComment(
  ticketId: number,
  content: string,
): Promise<PublicComment> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to post public comment.");
  }

  const result = await response.json();
  return result.data ?? result;
}

export async function getInternalNotes(
  ticketId: number,
): Promise<InternalNote[]> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/notes`, {
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to fetch internal notes.");
  }

  const result = await response.json();
  return result.data ?? [];
}

export async function createInternalNote(
  ticketId: number,
  content: string,
): Promise<InternalNote> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/notes`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to create internal note.");
  }

  const result = await response.json();
  return result.data ?? result;
}
