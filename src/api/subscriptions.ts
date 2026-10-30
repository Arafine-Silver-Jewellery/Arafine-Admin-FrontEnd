// Admin API client for Subscriptions (plans + customer subscriptions)
import type {
  AdminPlanListResponse,
  AdminSubscriptionsResponse,
  CreatePlanInput,
  SubscriptionPlan,
  CustomerSubscription,
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

export const subscriptionsApi = {
  // -- Plans --
  getPlans: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: string;
    status?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", params.page.toString());
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.search) q.set("search", params.search);
    if (params?.tier) q.set("tier", params.tier);
    if (params?.status) q.set("status", params.status);
    const query = q.toString();
    return request<AdminPlanListResponse>(`/subscriptions${query ? `?${query}` : ""}`);
  },
  createPlan: (data: CreatePlanInput) =>
    request<SubscriptionPlan>("/subscriptions", { method: "POST", body: JSON.stringify(data) }),
  updatePlan: (id: string, data: Partial<CreatePlanInput>) =>
    request<SubscriptionPlan>(`/subscriptions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePlan: (id: string) =>
    request<{ message: string }>(`/subscriptions/${id}`, { method: "DELETE" }),

  // -- Customer subscriptions --
  getSubscriptions: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", params.page.toString());
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    const query = q.toString();
    return request<AdminSubscriptionsResponse>(`/subscriptions/customers${query ? `?${query}` : ""}`);
  },
  cancelSubscription: (id: string, immediate: boolean) =>
    request<CustomerSubscription>(`/subscriptions/customers/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ immediate }),
    }),
  resumeSubscription: (id: string) =>
    request<CustomerSubscription>(`/subscriptions/customers/${id}/resume`, { method: "PATCH" }),
};
