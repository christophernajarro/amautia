"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch } from "@/lib/api";
import { getTokens, setTokens, clearTokens } from "@/lib/auth";
import { ROLE_ROUTES } from "@/lib/constants";
import { User, TokenResponse } from "@/types/user";

export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const { access } = getTokens();
      if (!access) {
        setUser(null);
        return;
      }
      try {
        const userData = await apiFetch<User>("/auth/me", { token: access });
        setUser(userData);
      } catch {
        clearTokens();
        setUser(null);
      }
    };
    if (!user && isLoading) {
      loadUser();
    }
  }, [user, isLoading, setUser]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.access_token, data.refresh_token);
    const userData = await apiFetch<User>("/auth/me", { token: data.access_token });
    setUser(userData);
    router.push(ROLE_ROUTES[userData.role] || "/");
  };

  const register = async (formData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    class_code?: string;
  }) => {
    const data = await apiFetch<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    setTokens(data.access_token, data.refresh_token);
    const userData = await apiFetch<User>("/auth/me", { token: data.access_token });
    setUser(userData);
    router.push(ROLE_ROUTES[userData.role] || "/");
  };

  const logout = () => {
    storeLogout();
    router.push("/login");
  };

  return { user, isLoading, login, register, logout };
}
