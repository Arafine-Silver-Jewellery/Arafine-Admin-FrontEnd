import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, type Employee } from "../api/auth";

interface AuthContextType {
  employee: Employee | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string | string[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Listen for 401s from any API call and force-logout. This is what
  // bounces a stale-session user back to /login when, e.g., the dashboard
  // tries to load trends against a server-side session that no longer exists.
  useEffect(() => {
    function handleAuthExpired() {
      // Fire-and-forget: logout() always clears local state via finally,
      // even if the BE /auth/logout call itself 401s.
      logout();
    }
    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, []);

  async function checkAuth() {
    try {
      const response = await authApi.getMe();
      setEmployee(response.employee);
      setPermissions(response.permissions || []);
    } catch {
      setEmployee(null);
      setPermissions([]);
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
    setPermissions(response.permissions || []);
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setEmployee(null);
      setPermissions([]);
    }
  }

  // Check if user has a specific permission (or any of multiple permissions)
  function hasPermission(permission: string | string[]): boolean {
    if (!employee) return false;
    
    // Admin has all permissions
    if (employee.role === "admin") return true;
    
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];
    return requiredPermissions.some(p => permissions.includes(p));
  }

  return (
    <AuthContext.Provider
      value={{
        employee,
        permissions,
        isLoading,
        isAuthenticated: !!employee,
        hasPermission,
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
