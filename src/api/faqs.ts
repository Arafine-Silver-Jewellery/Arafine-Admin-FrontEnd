// Admin API client for FAQs
import type { CreateFaqInput, Faq, FaqListResponse } from "../types";
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

export const faqsApi = {
  getFaqs: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: "published" | "draft";
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", params.page.toString());
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.search) q.set("search", params.search);
    if (params?.category) q.set("category", params.category);
    if (params?.status) q.set("status", params.status);
    const query = q.toString();
    return request<FaqListResponse>(`/faqs${query ? `?${query}` : ""}`);
  },
  createFaq: (data: CreateFaqInput) =>
    request<Faq>("/faqs", { method: "POST", body: JSON.stringify(data) }),
  updateFaq: (id: string, data: Partial<CreateFaqInput>) =>
    request<Faq>(`/faqs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteFaq: (id: string) =>
    request<{ message: string }>(`/faqs/${id}`, { method: "DELETE" }),
};
