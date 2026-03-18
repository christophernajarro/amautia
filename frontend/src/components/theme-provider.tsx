"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getTokens } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Load stored theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored && ["light", "dark", "system"].includes(stored)) {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  // Apply theme to document and listen for system changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const effective =
        theme === "system"
          ? mediaQuery.matches
            ? "dark"
            : "light"
          : theme;
      root.classList.toggle("dark", effective === "dark");
      root.style.colorScheme = effective;
      setResolvedTheme(effective);
    }

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme, mounted]);

  // Sync theme preference to backend (debounced, fire-and-forget)
  const syncToBackend = useCallback((t: Theme) => {
    const { access } = getTokens();
    if (!access) return;
    apiFetch("/auth/me", {
      token: access,
      method: "PUT",
      body: JSON.stringify({ theme: t }),
    }).catch(() => {
      // Non-critical: don't block UX if backend sync fails
    });
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      localStorage.setItem("theme", t);
      syncToBackend(t);
    },
    [syncToBackend]
  );

  // Prevent flash of wrong theme by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
