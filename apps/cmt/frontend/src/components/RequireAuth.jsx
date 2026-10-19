import { useEffect, useState } from "react";
import { getUserFromCookie } from "../utils/auth.js";
import { hasAnyRole } from "../utils/userRoles.js";
import LoginWrapper from "../utils/LoginWrapper.js";
import UnauthorizedPage from "../pages/UnauthorizedPage.jsx";

/**
 * @param {Object} props
 * @param {string[]} [props.roles]
 * @param {import("react").ReactNode} props.children 
 * @returns 
 */
export default function RequireAuth({ children, roles = [] }) {
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getUserFromCookie();
    setUser(u);
    setChecked(true);
  }, []);

  // Optionally show nothing or a loading indicator while checking
  if (!checked) {
    return null; // or <div>Loading...</div>
  }

  // Redirect to login page if not logged in
  if (!user) {
    return <LoginWrapper loginMode="" />;
  }

  // If user does not have permission, route to error page
  if (!hasAnyRole(user, roles)) {
    return <UnauthorizedPage></UnauthorizedPage>
  }

  // User exists & has permission → render protected content
  return children;
}