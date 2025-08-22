// src/app/Messaging/[email]/page.js
"use client";

import MessagingClient from "@/components/messaging/MessagingClient";
import { useParams } from "next/navigation";

/**
 * A page component that serves as a wrapper for the main MessagingClient.
 * Its primary purpose is to capture an email address from the URL parameters,
 * decode it, and pass it as an initial recipient to the messaging client.
 * This allows for creating direct links to message a specific user.
 * @returns {React.ReactNode} The MessagingClient component with a pre-filled email.
 */
export default function PreFilledMessagingPage() {
  // Use the useParams hook from Next.js to access dynamic route parameters.
  const params = useParams();

  // Decode the email from the URL parameter to correctly handle special characters (e.g., '+').
  const email = params.email ? decodeURIComponent(params.email) : "";

  // Render the main messaging component, passing the extracted email as a prop.
  return <MessagingClient initialEmail={email} />;
}