import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUserFromCookie } from "../utils/auth";

export default function RequireAuth({ children }) {
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const u = getUserFromCookie();
    setUser(u);
    setChecked(true);
  }, []);

  // Optionally show nothing or a loading indicator while checking
  if (!checked) {
    return null; // or <div>Loading...</div>
  }

  // If no user, bounce to /login (basename="/cmt" will make this /cmt/login)
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User exists → render protected content
  return children;
}
