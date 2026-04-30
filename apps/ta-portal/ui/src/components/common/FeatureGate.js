// src/components/common/FeatureGate.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, CircularProgress } from "@mui/material";
import { useFeatureFlags } from "@/configuration/featureFlags";

/**
 * FeatureGate component - protects pages behind feature flags
 * 
 * Usage:
 *   <FeatureGate feature={FEATURES.POSITIONS}>
 *     <YourPageContent />
 *   </FeatureGate>
 */
export default function FeatureGate({ feature, children, redirectTo = "/" }) {
  const router = useRouter();
  const { isFeatureEnabled, loading } = useFeatureFlags();

  useEffect(() => {
    if (!loading && !isFeatureEnabled(feature)) {
      router.replace(redirectTo);
    }
  }, [loading, isFeatureEnabled, feature, redirectTo, router]);

  if (loading || !isFeatureEnabled(feature)) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return <>{children}</>;
}
