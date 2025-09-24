"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GlobalError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Save the error to sessionStorage
    sessionStorage.setItem(
      "errorDetails",
      JSON.stringify({
        error: error.message,
        stack: error.stack, // Save stack trace here
        statusCode: 500,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      })
    );

    // Redirect to your custom page
    router.push("/Error");
  }, [error, router]);

  return null; // Nothing rendered, just redirect
}
