"use client";
import { useUser } from "utils/user-context/page";
import UnauthorizedPage from "unauthorized/page";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useUser();

  if (!user || user.type !== requiredRole) {
    return <UnauthorizedPage />;
  }

  return children;
}
