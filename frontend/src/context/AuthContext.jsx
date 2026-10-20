import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, apiError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null); // null = checking, false = anonymous
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setAdmin(data);
    } catch {
      setAdmin(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (identifier, password) => {
    try {
      const { data } = await api.post("/auth/login", { identifier, password });
      if (data.access_token) localStorage.setItem("tc_token", data.access_token);
      setAdmin(data.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: apiError(e, "Unable to sign in") };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* session already gone */
    }
    localStorage.removeItem("tc_token");
    setAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ admin, ready, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const can = (admin, capability) => {
  if (!admin) return false;
  const role = admin.role;
  if (role === "super_admin") return true;
  if (capability === "content") return role === "content_manager";
  if (capability === "enquiries") return role === "enquiry_manager";
  return false;
};
