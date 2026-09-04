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
  attachments?: any[];
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

