// Admin API client for Offers (BOGO / bundle / clearance)
import type { Offer, OfferStats, CreateOfferInput, UpdateOfferInput } from "../types";
import { API_BASE_URL } from "../config/env";

interface ApiResponse<T> {
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: OfferStats;
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

export const offersApi = {
  getOffers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    offerType?: string;
    status?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", params.page.toString());
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.search) q.set("search", params.search);
    if (params?.offerType) q.set("offerType", params.offerType);
    if (params?.status) q.set("status", params.status);
    const query = q.toString();
    return request<ApiResponse<Offer[]>>(`/offers-deals/offers${query ? `?${query}` : ""}`);
  },
  getOffer: (id: string) => request<Offer>(`/offers-deals/offers/${id}`),
  createOffer: (data: CreateOfferInput) =>
    request<Offer>("/offers-deals/offers", { method: "POST", body: JSON.stringify(data) }),
  updateOffer: (id: string, data: UpdateOfferInput) =>
    request<Offer>(`/offers-deals/offers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  setOfferActive: (id: string, isActive: boolean) =>
    request<Offer>(`/offers-deals/offers/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
  deleteOffer: (id: string) =>
    request<{ message: string }>(`/offers-deals/offers/${id}`, { method: "DELETE" }),
};
