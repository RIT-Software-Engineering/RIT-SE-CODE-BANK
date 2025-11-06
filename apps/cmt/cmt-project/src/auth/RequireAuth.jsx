import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }) {
  const { me, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Checking login…</div>;
  if (!me) return <Navigate to="/login" replace state={{ from: loc }} />;

  return children;
}
