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
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error("Health check failed");
  }

  const catRes = await fetch(`${API_URL}/api/categories`);
  if (!catRes.ok) {
    throw new Error("Failed to fetch categories");
  }

  const categories: Category[] = await catRes.json();
  return { online: true, categories };
}

export interface RequesterUser {
  id: number;
  name: string;
  email: string;
  department: string;
  isActive: boolean;
}

export async function fetchActiveRequesters(): Promise<RequesterUser[]> {
  const res = await fetch(`${API_URL}/api/requesters`);
  if (!res.ok) {
    throw new Error("Failed to fetch requesters");
  }
  return res.json();
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface Attachment {
  id: number;
  ticketId: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  filePath?: string;
  isRemoved: boolean;
  removedAt?: string | null;
  removalReason?: string | null;
  createdAt: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  currentStatus: string;
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  relatedSystem?: RelatedSystem;
  requester?: RequesterUser;
  attachments?: Attachment[];
  attachmentCount?: number;
}

export interface CreateTicketInput {
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  requestedPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  summary: string;
  description: string;
}

export async function fetchActiveCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  return res.json();
}

export async function fetchActiveRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/related-systems`);
  if (!res.ok) {
    throw new Error("Failed to fetch related systems");
  }
  return res.json();
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-requester-id": input.requesterId.toString(),
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || (errorData.details && errorData.details[0]) || "Failed to create ticket";
    const error = new Error(message);
    (error as any).details = errorData.details;
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedTicketsResult {
  items: Ticket[];
  pagination: PaginationMeta;
}

export interface GetTicketsParams {
  requesterId: number;
  search?: string;
  categoryId?: number | string;
  requestedPriority?: string;
  currentStatus?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export async function fetchMyTickets(params: GetTicketsParams): Promise<PaginatedTicketsResult> {
  const query = new URLSearchParams();
  query.set("requesterId", params.requesterId.toString());

  if (params.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.categoryId) {
    query.set("categoryId", params.categoryId.toString());
  }
  if (params.requestedPriority) {
    query.set("requestedPriority", params.requestedPriority);
  }
  if (params.currentStatus) {
    query.set("currentStatus", params.currentStatus);
  }
  if (params.page) {
    query.set("page", params.page.toString());
  }
  if (params.pageSize) {
    query.set("pageSize", params.pageSize.toString());
  }
  if (params.sortBy) {
    query.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    query.set("sortOrder", params.sortOrder);
  }

  const res = await fetch(`${API_URL}/api/tickets?${query.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch tickets");
  }
  return res.json();
}

export async function fetchTicketDetail(id: number, requesterId: number): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets/${id}`, {
    headers: {
      "x-requester-id": requesterId.toString(),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || "Failed to load ticket details";
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

export async function uploadAttachment(ticketId: number, file: File, requesterId: number): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("ticketId", ticketId.toString());
  formData.append("requesterId", requesterId.toString());

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: {
      "x-requester-id": requesterId.toString(),
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || "Failed to upload attachment";
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

export async function softRemoveAttachment(attachmentId: number, reason: string, requesterId: number): Promise<Attachment> {
  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}/soft-remove`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-requester-id": requesterId.toString(),
    },
    body: JSON.stringify({ removalReason: reason }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || "Failed to remove attachment";
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

export function getAttachmentDownloadUrl(attachmentId: number, requesterId?: number): string {
  const query = requesterId ? `?requesterId=${requesterId}` : "";
  return `${API_URL}/api/attachments/${attachmentId}/download${query}`;
}

// ---------------------------------------------------------------------------
// Lab 3: Auth, Staff, Comments, Notes, Admin Interfaces & Functions
// ---------------------------------------------------------------------------

export type UserRole = "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string | null;
  isActive?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || errorData.error || "Login failed";
    const error = new Error(message);
    (error as any).code = errorData.error?.code;
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || "Failed to fetch user profile";
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }

  const data = await res.json();
  return data.user;
}

export async function changeUserPassword(
  currentPassword: string,
  newPassword: string,
  token: string
): Promise<{ message: string; mustChangePassword: boolean }> {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || "Failed to change password";
    const error = new Error(message);
    (error as any).code = errorData.error?.code;
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

export interface StaffTicket extends Ticket {
  actualPriority?: string | null;
  ownerId?: number | null;
  owner?: AuthUser | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  comments?: CommentItem[];
  internalNotes?: InternalNoteItem[];
}

export interface StaffQueueParams {
  search?: string;
  status?: string;
  priority?: string;
  ownerId?: string | number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export async function fetchStaffQueue(
  params: StaffQueueParams,
  token: string
): Promise<{ data: StaffTicket[]; pagination: PaginationMeta }> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status) query.set("status", params.status);
  if (params.priority) query.set("priority", params.priority);
  if (params.ownerId !== undefined && params.ownerId !== "") query.set("ownerId", params.ownerId.toString());
  if (params.page) query.set("page", params.page.toString());
  if (params.pageSize) query.set("pageSize", params.pageSize.toString());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);

  const res = await fetch(`${API_URL}/api/staff/tickets?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || "Failed to fetch staff queue";
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

export async function fetchStaffTicketDetail(ticketId: number, token: string): Promise<StaffTicket> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || "Failed to fetch ticket detail";
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }

  const data = await res.json();
  return data.data || data;
}

export async function assignTicketOwner(
  ticketId: number,
  ownerId: number | null,
  token: string
): Promise<StaffTicket> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/assign`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ownerId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || "Failed to assign ticket";
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }

  const data = await res.json();
  return data.data;
}

export async function updateStaffPriority(
  ticketId: number,
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  token: string
): Promise<StaffTicket> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/priority`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ priority }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || "Failed to update priority";
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }

  const data = await res.json();
  return data.data;
}

export async function updateStaffStatus(
  ticketId: number,
  status: string,
  token: string
): Promise<StaffTicket> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error?.message || "Failed to update status";
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }

  const data = await res.json();
  return data.data;
}

// ---------------------------------------------------------------------------
// Comments & Notes
// ---------------------------------------------------------------------------

export interface CommentItem {
  id: number;
  ticketId: number;
  userId: number;
  message: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    role: UserRole;
  };
}

export interface InternalNoteItem {
  id: number;
  ticketId: number;
  userId: number;
  note: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    role: UserRole;
  };
}

export async function fetchComments(ticketId: number, token: string): Promise<CommentItem[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to fetch comments");
  }

  const data = await res.json();
  return data.comments || [];
}

export async function addComment(
  ticketId: number,
  message: string,
  token: string
): Promise<CommentItem> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to post comment");
  }

  const data = await res.json();
  return data.comment;
}

export async function fetchInternalNotes(ticketId: number, token: string): Promise<InternalNoteItem[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to fetch notes");
  }

  const data = await res.json();
  return data.notes || [];
}

export async function addInternalNote(
  ticketId: number,
  note: string,
  token: string
): Promise<InternalNoteItem> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ note }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to post note");
  }

  const data = await res.json();
  return data.note;
}

// ---------------------------------------------------------------------------
// Admin User Management
// ---------------------------------------------------------------------------

export interface AdminUsersParams {
  search?: string;
  role?: string;
  isActive?: boolean | string;
  page?: number;
  pageSize?: number;
}

export async function fetchAdminUsers(
  params: AdminUsersParams,
  token: string
): Promise<{ data: AuthUser[]; pagination: PaginationMeta }> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.role) query.set("role", params.role);
  if (params.isActive !== undefined && params.isActive !== "") query.set("isActive", params.isActive.toString());
  if (params.page) query.set("page", params.page.toString());
  if (params.pageSize) query.set("pageSize", params.pageSize.toString());

  const res = await fetch(`${API_URL}/api/admin/users?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to fetch users");
  }

  return res.json();
}

export async function createAdminUser(
  userData: {
    name: string;
    email: string;
    role: UserRole;
    department?: string;
    password?: string;
  },
  token: string
): Promise<{ user: AuthUser; temporaryPassword?: string }> {
  const res = await fetch(`${API_URL}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to create user");
  }

  return res.json();
}

export async function updateAdminUser(
  userId: number,
  updates: {
    name?: string;
    role?: UserRole;
    department?: string;
    isActive?: boolean;
  },
  token: string
): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to update user");
  }

  const data = await res.json();
  return data.data;
}

export async function resetAdminUserPassword(
  userId: number,
  token: string
): Promise<{ message: string; temporaryPassword?: string; mustChangePassword: boolean }> {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to reset password");
  }

  return res.json();
}


