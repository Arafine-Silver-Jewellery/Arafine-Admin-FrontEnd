// Admin API client for customer wallets
import { API_BASE_URL } from "../config/env";

export interface AdminWalletRow {
  id: string;
  userId: string;
  userName: string;
  userMobileNumber: string;
  balance: number;
}

export interface AdminWalletListResponse {
  data: AdminWalletRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface WalletBonusSettings {
  bonusAmount: number;
  minTopUpForBonus: number;
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

export const walletApi = {
  getWallets: (params?: { page?: number; limit?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", params.page.toString());
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.search) q.set("search", params.search);
    const query = q.toString();
    return request<AdminWalletListResponse>(`/wallet${query ? `?${query}` : ""}`);
  },
  adjustWallet: (userId: string, amount: number, direction: "credit" | "debit", note: string | null) =>
    request<{ balance: number }>(`/wallet/${userId}/adjust`, {
      method: "POST",
      body: JSON.stringify({ amount, direction, note }),
    }),
  getBonus: () => request<WalletBonusSettings>("/wallet/bonus"),
  saveBonus: (settings: WalletBonusSettings) =>
    request<WalletBonusSettings>("/wallet/bonus", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
};
