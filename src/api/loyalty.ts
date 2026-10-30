// Admin API client for loyalty points
import { API_BASE_URL } from "../config/env";

export interface LoyaltyRules {
  pointsPerRupee: number;
  redeemRupeesPerPoint: number;
  expiryMonths: number;
  minRedeemPoints: number;
}

export interface LoyaltyCustomerRow {
  userId: string;
  userName: string;
  userMobileNumber: string;
  balance: number;
  earned: number;
  redeemed: number;
  tier: string;
}

export interface LoyaltyCustomerListResponse {
  data: LoyaltyCustomerRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
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

export const loyaltyApi = {
  getRules: () => request<LoyaltyRules>("/loyalty/rules"),
  saveRules: (rules: LoyaltyRules) =>
    request<LoyaltyRules>("/loyalty/rules", { method: "PUT", body: JSON.stringify(rules) }),
  getCustomers: (params?: { page?: number; limit?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", params.page.toString());
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.search) q.set("search", params.search);
    const query = q.toString();
    return request<LoyaltyCustomerListResponse>(`/loyalty/customers${query ? `?${query}` : ""}`);
  },
};
