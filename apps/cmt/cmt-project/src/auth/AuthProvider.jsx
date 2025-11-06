import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/me", { credentials: "include" });
      if (!resp.ok) throw new Error("unauthorized");
      const data = await resp.json();
      setMe(data.me || null);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = { me, loading, refresh, setMe };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
