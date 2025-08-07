// src/app/Messaging/[email]/page.js
"use client";

import MessagingClient from "@/components/messaging/MessagingClient";
import { useParams } from "next/navigation";

export default function PreFilledMessagingPage() {
  const params = useParams();

  // Decode the email from the URL parameter to handle special characters
  const email = params.email ? decodeURIComponent(params.email) : "";

  return <MessagingClient initialEmail={email} />;
}