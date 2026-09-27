import { API_BASE_URL } from "../config/env";

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "employee";
  createdAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  otpSent: boolean;
}

export interface VerifyOtpResponse {
  success: boolean;
  employee: Employee;
}

export interface MeResponse {
  success: boolean;
  employee: Employee;
}

export interface AuthErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

async function authRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const error = data as AuthErrorResponse;
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  return data;
}

export const authApi = {
  login: (email: string, password: string) =>
    authRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verifyOtp: (email: string, otp: string) =>
    authRequest<VerifyOtpResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  logout: () =>
    authRequest<void>("/auth/logout", {
      method: "POST",
    }),

  logoutAll: () =>
    authRequest<void>("/auth/logout-all", {
      method: "POST",
    }),

  getMe: () => authRequest<MeResponse>("/auth/me"),
};
