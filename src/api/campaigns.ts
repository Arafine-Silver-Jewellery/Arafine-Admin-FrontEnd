// Admin API client for promotion Campaigns (email / push / in-app)
import type { Campaign, CampaignListResponse, CampaignStats, CreateCampaignInput, UpdateCampaignInput } from "../types";
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

export const campaignsApi = {
  getCampaigns: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    channel?: string;
    status?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", params.page.toString());
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.search) q.set("search", params.search);
    if (params?.channel) q.set("channel", params.channel);
    if (params?.status) q.set("status", params.status);
    const query = q.toString();
    return request<CampaignListResponse>(`/campaigns${query ? `?${query}` : ""}`);
  },
  getCampaign: (id: string) => request<Campaign>(`/campaigns/${id}`),
  getCalendar: () => request<{ data: Campaign[] }>("/campaigns/calendar"),
  getAnalytics: () => request<CampaignStats>("/campaigns/analytics"),
  createCampaign: (data: CreateCampaignInput) =>
    request<Campaign>("/campaigns", { method: "POST", body: JSON.stringify(data) }),
  updateCampaign: (id: string, data: UpdateCampaignInput) =>
    request<Campaign>(`/campaigns/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  setCampaignPublished: (id: string, isPublished: boolean) =>
    request<Campaign>(`/campaigns/${id}/published`, {
      method: "PATCH",
      body: JSON.stringify({ isPublished }),
    }),
  deleteCampaign: (id: string) =>
    request<{ message: string }>(`/campaigns/${id}`, { method: "DELETE" }),
};
