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

  const categoriesResponse = await fetch(`${API_URL}/api/categories`);

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
      "X-Requester-Id": String(input.requesterId),
    },
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
  requesterId: number,
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
      headers: {
        "X-Requester-Id": String(requesterId),
      },
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
  requesterId: number,
): Promise<MyTicket[]> {
  console.log("GET MY TICKETS REQUEST", {
    requesterId,
    url: `${API_URL}/api/tickets`,
  });

  const response = await fetch(`${API_URL}/api/tickets`, {
    headers: {
      "X-Requester-Id": String(requesterId),
    },
  });

  console.log("GET MY TICKETS RESPONSE", {
    requesterId,
    status: response.status,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.error || "Failed to fetch tickets.",
    );
  }

  const data = await response.json();

  console.log("GET MY TICKETS BODY", data);

  const tickets: MyTicket[] = data.data ?? data;

  console.log("GET MY TICKETS PARSED", {
    count: tickets.length,
    ticketNumbers: tickets.map(
      (ticket) => ticket.ticketNumber,
    ),
  });

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
  createdAt: string;
  updatedAt: string;
  attachments: TicketAttachment[];
}

export async function getTicketDetail(
  ticketId: number,
  requesterId: number,
): Promise<TicketDetail> {
  const response = await fetch(
    `${API_URL}/api/tickets/${ticketId}`,
    {
      headers: {
        "X-Requester-Id": String(requesterId),
      },
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

