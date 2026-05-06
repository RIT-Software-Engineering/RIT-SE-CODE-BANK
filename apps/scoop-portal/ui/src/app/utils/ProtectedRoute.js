"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "utils/user-context/page";
import UnauthorizedPage from "unauthorized/page";
import { Box, CircularProgress } from "@mui/material";

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const { user } = useUser();

  // Uncomment this for production
  // const router = useRouter();
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/me`, { credentials: "include" })
  //     .then((res) => {
  //       if (!res.ok) {
  //         window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/login?returnTo=${encodeURIComponent(window.location.href)}`;
  //       }
  //     })
  //     .catch(() => {
  //       window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/login?returnTo=${encodeURIComponent(window.location.href)}`;
  //     })
  //     .finally(() => setLoading(false));
  // }, [router]);

  // if (loading) {
  //   return (
  //     <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
  //       <CircularProgress />
  //     </Box>
  //   );
  // }

  // if (!user) return null;

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.type)) {
    return <UnauthorizedPage />;
  }

  return children;
}