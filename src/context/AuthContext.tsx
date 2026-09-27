import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, type Employee } from "../api/auth";

interface AuthContextType {
  employee: Employee | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await authApi.getMe();
      setEmployee(response.employee);
    } catch {
      setEmployee(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    await authApi.login(email, password);
  }

  async function verifyOtp(email: string, otp: string) {
    const response = await authApi.verifyOtp(email, otp);
    setEmployee(response.employee);
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setEmployee(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        employee,
        isLoading,
        isAuthenticated: !!employee,
        login,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
