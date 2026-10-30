// Admin API client for support tickets
import type {
  SupportTicket,
  TicketListResponse,
  TicketPriority,
  TicketStatus,
} from "../types";
import { API_BASE_URL } from "../config/env";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const supportApi = {
  getTickets: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", params.page.toString());
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    if (params?.priority) q.set("priority", params.priority);
    if (params?.category) q.set("category", params.category);
    const query = q.toString();
    return request<TicketListResponse>(`/support/tickets${query ? `?${query}` : ""}`);
  },
  getTicket: (id: string) => request<SupportTicket>(`/support/tickets/${id}`),
  updateTicket: (id: string, data: { status?: TicketStatus; priority?: TicketPriority; assignedToId?: string | null }) =>
    request<SupportTicket>(`/support/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  replyTicket: (id: string, body: string, isInternalNote: boolean) =>
    request<SupportTicket>(`/support/tickets/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body, isInternalNote }),
    }),
};
