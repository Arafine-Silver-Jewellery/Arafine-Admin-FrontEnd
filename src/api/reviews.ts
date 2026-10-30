// Admin API client for review moderation
import { API_BASE_URL } from "../config/env";

export interface AdminReviewRow {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  imageUrls: string[];
  helpfulCount: number;
  isVisible: boolean;
  adminReply: string | null;
  adminReplyAt: string | null;
  userId: string;
  productId: string;
  productName: string | null;
  createdAt: string;
}

export interface AdminReviewListResponse {
  data: AdminReviewRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  stats: { total: number; pending: number; approved: number; rejected: number };
}

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

export const reviewsApi = {
  getReviews: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "pending" | "approved" | "rejected";
    rating?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", params.page.toString());
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    if (params?.rating) q.set("rating", params.rating.toString());
    const query = q.toString();
    return request<AdminReviewListResponse>(`/reviews${query ? `?${query}` : ""}`);
  },
  moderate: (id: string, approve: boolean) =>
    request<AdminReviewRow>(`/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ approve }),
    }),
  reply: (id: string, reply: string) =>
    request<AdminReviewRow>(`/reviews/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply }),
    }),
};
