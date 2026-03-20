"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@/components/analytics";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
      },
    },
  }));

  useEffect(() => {
    const handleLogout = () => queryClient.clear();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [queryClient]);

  // Register PWA service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Suspense fallback={null}><Analytics /></Suspense>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
