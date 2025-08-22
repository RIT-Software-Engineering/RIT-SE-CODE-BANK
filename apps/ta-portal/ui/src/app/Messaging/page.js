// src/app/Messaging/page.js
"use client";

import MessagingClient from "@/components/messaging/MessagingClient";

/**
 * Renders the main messaging page.
 * This component serves as the primary entry point for the messaging feature,
 * loading the core `MessagingClient` component without any pre-filled data.
 * @returns {React.ReactNode} The MessagingClient component.
 */
export default function MessagingPage() {
  // This page simply renders the main client for the messaging interface.
  return <MessagingClient />;
}