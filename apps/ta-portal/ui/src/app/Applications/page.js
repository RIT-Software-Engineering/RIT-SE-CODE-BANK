"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";

// Universal Applications landing page
// Redirects the currently logged-in user to the correct sub-view
// based on their role, preserving any query parameters (e.g., jobPositionId, applicationId).
export default function ApplicationsLanding() {
  return (
    <Suspense fallback={<RedirectLoading />}> 
      <ApplicationsRedirector />
    </Suspense>
  );
}

function ApplicationsRedirector() {
  const router = useRouter();
  const search = useSearchParams();
  const { currentUser } = useAuth();

  useEffect(() => {
    // No user -> send to root (login)
    if (!currentUser) {
      const qs = search?.toString();
      const returnTo = "/Applications" + (qs ? `?${qs}` : "");
      router.replace(`/?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    const role = String(currentUser.role || "").toUpperCase();
    const username = currentUser.username;

    let segment = "Candidate"; // default
    if (role === "ADMIN") segment = "Admin";
    else if (role === "EMPLOYER") segment = "Employer";
    else if (role === "EMPLOYEE") segment = "Employee";
    else if (role === "CANDIDATE") segment = "Candidate";

    const params = new URLSearchParams(search?.toString() || "");
    if (
      segment === "Admin" &&
      !params.has("tab") &&
      (params.has("jobPositionId") || params.has("applicationId"))
    ) {
      params.set("tab", "hiring");
    }
    const qs = params.toString();
    const dest = `/Applications/${segment}/${encodeURIComponent(username)}${qs ? `?${qs}` : ""}`;
    router.replace(dest);
  }, [currentUser, router, search]);

  return <RedirectLoading />;
}

function RedirectLoading() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
          Redirecting to your Applications view…
        </Typography>
      </Box>
    </Box>
  );
}
