// src/app/Messaging/page.js
"use client";

import MessagingClient from "@/components/messaging/MessagingClient";
import FeatureGate from "@/components/common/FeatureGate";
import { FEATURES } from "@/configuration/featureFlags";

/**
 * Renders the main messaging page.
 * This component serves as the primary entry point for the messaging feature,
 * loading the core `MessagingClient` component without any pre-filled data.
 * @returns {React.ReactNode} The MessagingClient component.
 */
export default function MessagingPage() {
  return (
    <FeatureGate feature={FEATURES.MESSAGING}>
      <MessagingClient />
    </FeatureGate>
  );
}