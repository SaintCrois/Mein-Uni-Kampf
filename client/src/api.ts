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

export interface CreateTicketAttachment {
  file: File;
}

export interface CreateTicketInput {
  requesterId: number;
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



export async function getActiveRequesters(): Promise<Requester[]> {
  const response = await fetch(`${API_URL}/api/requesters/active`);

  if (!response.ok) {
    throw new Error("Failed to fetch active requesters.");
  }

  const data = await response.json();
  return data.data ?? data;
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
  const response = await fetch(`${API_URL}/api/categories`);

  if (!response.ok) {
    throw new Error("Failed to fetch categories.");
  }

  return response.json();
}

export async function getRelatedSystems(): Promise<ReferenceItem[]> {
  const response = await fetch(`${API_URL}/api/related-systems`);

  if (!response.ok) {
    throw new Error("Failed to fetch related systems.");
  }

  return response.json();
}

export async function getPriorities(): Promise<ReferenceItem[]> {
  const response = await fetch(`${API_URL}/api/priorities`);

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
  createdAt: string;
}


export async function getMyTickets(
  _requesterId: number,
): Promise<MyTicket[]> {
  const response = await fetch(`${API_URL}/api/tickets`, {
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.error || "Failed to fetch tickets.",
    );
  }

  const data = await response.json();

  const tickets: MyTicket[] = data.data ?? data;

  return tickets;
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
  return result.data ?? [];
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
