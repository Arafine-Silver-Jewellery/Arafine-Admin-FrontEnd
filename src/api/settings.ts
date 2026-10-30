// Admin API client for store settings
import type { AppSettings } from "../types";
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

export const settingsApi = {
  get: () => request<AppSettings>("/settings"),
  save: (settings: Partial<AppSettings>) =>
    request<AppSettings>("/settings", { method: "PUT", body: JSON.stringify(settings) }),
};
