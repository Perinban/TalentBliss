import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  const refreshSession = useCallback(async () => {
    try {
      const result = await apiRequest("/api/auth/session");
      setUser(result.user);
      setError(null);
    } catch (sessionError) {
      setUser(null);
      setError(sessionError);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (credentials) => {
    const result = await apiRequest("/api/auth/login", { method: "POST", body: credentials });
    setUser(result.user);
    setError(null);
    return result.user;
  }, []);

  const register = useCallback(async (details) => {
    const result = await apiRequest("/api/auth/register", { method: "POST", body: details });
    setUser(result.user);
    setError(null);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await apiRequest("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const updateRole = useCallback(async (role) => {
    const result = await apiRequest("/api/auth/role", { method: "PATCH", body: { role } });
    setUser(result.user);
    return result.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoaded,
      isSignedIn: Boolean(user),
      error,
      login,
      register,
      logout,
      updateRole,
      refreshSession,
    }),
    [user, isLoaded, error, login, register, logout, updateRole, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export const useUser = useAuth;
