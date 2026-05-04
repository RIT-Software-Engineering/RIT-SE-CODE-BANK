import { useEffect, useState } from "react";
import { getUserFromCookie } from "../utils/auth.js";
import LoginWrapper from "../utils/LoginWrapper.js";

/**
 * @param {Object} props
 * @param {string[]} [props.roles]
 * @param {import("react").ReactNode} props.children 
 * @returns 
 */
export default function RequireAuth({ children, roles }) {
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
  
  // If no user, bounce to /login (basename="/cmt" will make this /cmt/login)
  // if (!user) {
  //   console.log("NODE_ENV = " , process.env.NODE_ENV)
  //   return <LoginWrapper loginMode={process.env.NODE_ENV === "production" ? "shibb" : undefined} />;
  // }

  if (!user) {
    return <LoginWrapper loginMode="shibb" />;
  }

  // User exists → render protected content
  return children;
}