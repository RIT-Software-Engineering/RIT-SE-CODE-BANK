"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "utils/user-context/page";
import UnauthorizedPage from "unauthorized/page";
import { Box, CircularProgress } from "@mui/material";

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authOK, setAuthOK] = useState(true); // Set false for production

  // Uncomment for production
  // useEffect(() => {
  //   // Skip auth check if we just logged out
  //   const isLoggingOut = localStorage.getItem("logging_out");
  //   if (isLoggingOut) {
  //     localStorage.removeItem("logging_out");
  //     setLoading(false);
  //     return;
  //   }

  //   if (user) {
  //     setAuthOK(true);
  //     setLoading(false);
  //     return;
  //   }

  //   fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/me`, { credentials: "include" })
  //     .then((res) => {
  //       if (!res.ok) {
  //         window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/login?returnTo=${encodeURIComponent(window.location.href)}`;
  //         return;
  //       }
  //       setAuthOK(true);
  //     })
  //     .catch(() => {
  //       window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/login?returnTo=${encodeURIComponent(window.location.href)}`;
  //     })
  //     .finally(() => setLoading(false));
  // }, [router, user]);

  useEffect(() => {
    if (!loading && authOK && !user) {
      router.push("/user-login");
    }
  }, [loading, authOK, user, router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!authOK || !user) return null;

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.type)) {
    return <UnauthorizedPage />;
  }

  return children;
}