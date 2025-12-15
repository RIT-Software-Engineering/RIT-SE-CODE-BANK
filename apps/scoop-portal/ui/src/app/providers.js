// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children}) {
  return (
    // We must manually specify the basePath because you are using /scoop-portal
    <SessionProvider basePath="/scoop-portal/api/auth">
      {children}
    </SessionProvider>
  );
}