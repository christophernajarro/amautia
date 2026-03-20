"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Google Analytics 4
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID) return;

    // Load GA script
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag("js", new Date());
    gtag("config", GA_ID, { send_page_view: false });

    // Make gtag available globally
    (window as any).gtag = gtag;

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Track page views
  useEffect(() => {
    if (!GA_ID || !(window as any).gtag) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
    (window as any).gtag("event", "page_view", { page_path: url });
  }, [pathname, searchParams]);

  return null;
}

// Track custom events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if ((window as any).gtag) {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
}

// Declare global types
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
