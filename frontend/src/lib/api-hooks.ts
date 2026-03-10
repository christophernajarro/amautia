"use client";
// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { getTokens } from "./auth";

function useToken() {
  if (typeof window === "undefined") return null;
  return getTokens().access;
}

// Admin
export function useAdminStats() {
  const token = useToken();
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiFetch("/admin/dashboard/stats", { token: token! }),
    enabled: !!token,
  });
}

export function useAdminUsers(filters?: { role?: string; search?: string }) {
  const token = useToken();
  const params = new URLSearchParams();
  if (filters?.role) params.set("role", filters.role);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString() ? `?${params}` : "";
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => apiFetch<any[]>(`/admin/users${qs}`, { token: token! }),
    enabled: !!token,
  });
}

export function useCreateUser() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/admin/users", { method: "POST", body: JSON.stringify(data), token: token! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useToggleUserStatus() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiFetch(`/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ is_active }), token: token! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useDeleteUser() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/users/${id}`, { method: "DELETE", token: token! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminPlans() {
  const token = useToken();
  return useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => apiFetch<any[]>("/admin/plans", { token: token! }),
    enabled: !!token,
  });
}

export function useAdminProviders() {
  const token = useToken();
  return useQuery({
    queryKey: ["admin", "providers"],
    queryFn: () => apiFetch<any[]>("/admin/ai/providers", { token: token! }),
    enabled: !!token,
  });
}

export function useAdminPayments(status?: string) {
  const token = useToken();
  const qs = status ? `?status_filter=${status}` : "";
  return useQuery({
    queryKey: ["admin", "payments", status],
    queryFn: () => apiFetch<any[]>(`/admin/payments${qs}`, { token: token! }),
    enabled: !!token,
  });
}

export function useAdminConfig() {
  const token = useToken();
  return useQuery({
    queryKey: ["admin", "config"],
    queryFn: () => apiFetch<any[]>("/admin/config", { token: token! }),
    enabled: !!token,
  });
}

export function useAdminLogs() {
  const token = useToken();
  return useQuery({
    queryKey: ["admin", "logs"],
    queryFn: () => apiFetch<any[]>("/admin/logs", { token: token! }),
    enabled: !!token,
  });
}

// Profesor
export function useProfesorDashboard() {
  const token = useToken();
  return useQuery({
    queryKey: ["profesor", "dashboard"],
    queryFn: () => apiFetch<any>("/profesor/dashboard", { token: token! }),
    enabled: !!token,
  });
}

export function useProfesorSubjects() {
  const token = useToken();
  return useQuery({
    queryKey: ["profesor", "subjects"],
    queryFn: () => apiFetch<any[]>("/profesor/subjects", { token: token! }),
    enabled: !!token,
  });
}

export function useCreateSubject() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/profesor/subjects", { method: "POST", body: JSON.stringify(data), token: token! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profesor"] }),
  });
}

export function useDeleteSubject() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/profesor/subjects/${id}`, { method: "DELETE", token: token! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profesor"] }),
  });
}

export function useProfesorExams() {
  const token = useToken();
  return useQuery({
    queryKey: ["profesor", "exams"],
    queryFn: () => apiFetch<any[]>("/profesor/exams", { token: token! }),
    enabled: !!token,
  });
}

// Alumno
export function useAlumnoDashboard() {
  const token = useToken();
  return useQuery({
    queryKey: ["alumno", "dashboard"],
    queryFn: () => apiFetch<any>("/alumno/dashboard", { token: token! }),
    enabled: !!token,
  });
}

export function useAlumnoSections() {
  const token = useToken();
  return useQuery({
    queryKey: ["alumno", "sections"],
    queryFn: () => apiFetch<any[]>("/alumno/sections", { token: token! }),
    enabled: !!token,
  });
}

export function useAlumnoExams() {
  const token = useToken();
  return useQuery({
    queryKey: ["alumno", "exams"],
    queryFn: () => apiFetch<any[]>("/alumno/exams", { token: token! }),
    enabled: !!token,
  });
}

export function useJoinSection() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (class_code: string) =>
      apiFetch("/alumno/join", { method: "POST", body: JSON.stringify({ class_code }), token: token! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alumno"] }),
  });
}

// Notifications
export function useNotifications() {
  const token = useToken();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<any[]>("/notifications/", { token: token! }),
    enabled: !!token,
  });
}

export function useUnreadCount() {
  const token = useToken();
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => apiFetch<{ count: number }>("/notifications/unread-count", { token: token! }),
    enabled: !!token,
    refetchInterval: 30000,
  });
}

// Payments
export function usePublicPlans() {
  return useQuery({
    queryKey: ["public", "plans"],
    queryFn: () => apiFetch<any[]>("/payments/plans"),
  });
}

export function useMySubscription() {
  const token = useToken();
  return useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => apiFetch<any>("/payments/my-subscription", { token: token! }),
    enabled: !!token,
  });
}
