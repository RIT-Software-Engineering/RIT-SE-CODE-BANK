"use client";
import { useUser } from "utils/user-context/page";
import UnauthorizedPage from "unauthorized/page";

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const { user } = useUser();

  if (!user || !requiredRoles.includes(user.type)) {
    return <UnauthorizedPage />;
  }

  return children;
}