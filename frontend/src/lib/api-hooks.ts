"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";
import { getTokens } from "./auth";
import { toast } from "sonner";

/** Read token fresh from localStorage inside every queryFn / mutationFn closure. */
function freshToken(): string {
  if (typeof window === "undefined") return "";
  return getTokens().access || "";
}

function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!getTokens().access;
}

// Admin
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiFetch("/admin/dashboard/stats", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useAdminUsers(filters?: { role?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.role) params.set("role", filters.role);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString() ? `?${params}` : "";
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => apiFetch<any[]>(`/admin/users${qs}`, { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/admin/users", { method: "POST", body: JSON.stringify(data), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiFetch(`/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ is_active }), token: freshToken() }),
    onMutate: async ({ id, is_active }) => {
      // Cancel any in-flight user queries to avoid overwriting optimistic update
      await qc.cancelQueries({ queryKey: ["admin", "users"] });
      // Snapshot all user query entries (may have multiple filter variants)
      const previousQueries: Array<{ queryKey: readonly unknown[]; data: any }> = [];
      qc.getQueriesData<any[]>({ queryKey: ["admin", "users"] }).forEach(([queryKey, data]) => {
        previousQueries.push({ queryKey, data });
        qc.setQueryData<any[]>(queryKey, (old) =>
          old?.map((u) => u.id === id ? { ...u, is_active } : u)
        );
      });
      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Revert all cached user queries
      context?.previousQueries.forEach(({ queryKey, data }) => {
        qc.setQueryData(queryKey, data);
      });
      toast.error("Error al cambiar estado del usuario: " + (_err as Error).message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/users/${id}`, { method: "DELETE", token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminPlans() {
  return useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => apiFetch<any[]>("/admin/plans", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: any; description: string }) =>
      apiFetch(`/admin/config/${key}`, { method: "PUT", body: JSON.stringify({ value, description }), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "config"] }),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/admin/plans", { method: "POST", body: JSON.stringify(data), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      apiFetch(`/admin/plans/${id}`, { method: "PUT", body: JSON.stringify(data), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
  });
}

export function useTogglePlanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plan_id, is_active }: { plan_id: string; is_active: boolean }) =>
      apiFetch(`/admin/plans/${plan_id}/status`, { method: "PATCH", body: JSON.stringify({ is_active }), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; first_name: string; last_name: string; role: string; phone: string }) =>
      apiFetch(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminProviders() {
  return useQuery({
    queryKey: ["admin", "providers"],
    queryFn: () => apiFetch<any[]>("/admin/ai/providers", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/admin/ai/providers", { method: "POST", body: JSON.stringify(data), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "providers"] }),
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; api_key?: string; is_active?: boolean; config?: any }) =>
      apiFetch(`/admin/ai/providers/${id}`, { method: "PUT", body: JSON.stringify(data), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "providers"] }),
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/ai/providers/${id}`, { method: "DELETE", token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "providers"] }),
  });
}

export function useTestProvider() {
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ status: string; message: string }>(`/admin/ai/providers/${id}/test`, { method: "POST", token: freshToken() }),
  });
}

export function useAdminModels() {
  return useQuery({
    queryKey: ["admin", "models"],
    queryFn: () => apiFetch<any[]>("/admin/ai/models", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useCreateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/admin/ai/models", { method: "POST", body: JSON.stringify(data), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "models"] }),
  });
}

export function useUpdateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; model_id?: string; supports_vision?: boolean; supports_text?: boolean; max_tokens?: number | null; is_active?: boolean }) =>
      apiFetch(`/admin/ai/models/${id}`, { method: "PUT", body: JSON.stringify(data), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "models"] }),
  });
}

export function useDeleteModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/ai/models/${id}`, { method: "DELETE", token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "models"] }),
  });
}

export function useSetDefaultModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, task }: { id: string; task: string }) =>
      apiFetch(`/admin/ai/models/${id}/default?task=${task}`, { method: "PATCH", token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "models"] }),
  });
}

export function useAdminPayments(status?: string) {
  const qs = status ? `?status_filter=${status}` : "";
  return useQuery({
    queryKey: ["admin", "payments", status],
    queryFn: () => apiFetch<any[]>(`/admin/payments${qs}`, { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useAdminConfig() {
  return useQuery({
    queryKey: ["admin", "config"],
    queryFn: () => apiFetch<any[]>("/admin/config", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useAdminLogs() {
  return useQuery({
    queryKey: ["admin", "logs"],
    queryFn: () => apiFetch<any[]>("/admin/logs", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

// Profesor
export function useProfesorDashboard() {
  return useQuery({
    queryKey: ["profesor", "dashboard"],
    queryFn: () => apiFetch<any>("/profesor/dashboard", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useProfesorSubjects() {
  return useQuery({
    queryKey: ["profesor", "subjects"],
    queryFn: () => apiFetch<any[]>("/profesor/subjects", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch("/profesor/subjects", { method: "POST", body: JSON.stringify(data), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profesor"] }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/profesor/subjects/${id}`, { method: "DELETE", token: freshToken() }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["profesor", "subjects"] });
      const previous = qc.getQueryData<any[]>(["profesor", "subjects"]);
      qc.setQueryData<any[]>(["profesor", "subjects"], (old) =>
        old?.filter((s) => s.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData(["profesor", "subjects"], context?.previous);
      toast.error("Error al eliminar materia: " + (_err as Error).message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["profesor"] }),
  });
}

export function useProfesorExams() {
  return useQuery({
    queryKey: ["profesor", "exams"],
    queryFn: () => apiFetch<any[]>("/profesor/exams", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useEnrolledStudents(examId: string) {
  return useQuery({
    queryKey: ["exam", examId, "enrolled-students"],
    queryFn: () => apiFetch<any>(`/profesor/exams/${examId}/enrolled-students`, { token: freshToken() }),
    enabled: isAuthenticated() && !!examId,
  });
}

// Alumno
export function useAlumnoDashboard() {
  return useQuery({
    queryKey: ["alumno", "dashboard"],
    queryFn: () => apiFetch<any>("/alumno/dashboard", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useAlumnoSections() {
  return useQuery({
    queryKey: ["alumno", "sections"],
    queryFn: () => apiFetch<any[]>("/alumno/sections", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useAlumnoExams() {
  return useQuery({
    queryKey: ["alumno", "exams"],
    queryFn: () => apiFetch<any[]>("/alumno/exams", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useJoinSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (class_code: string) =>
      apiFetch("/alumno/join", { method: "POST", body: JSON.stringify({ class_code }), token: freshToken() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alumno"] }),
  });
}

// Notifications
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<any[]>("/notifications/", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => apiFetch<{ count: number }>("/notifications/unread-count", { token: freshToken() }),
    enabled: isAuthenticated(),
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
  return useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => apiFetch<any>("/payments/my-subscription", { token: freshToken() }),
    enabled: isAuthenticated(),
  });
}

// ─── Gamification ───
export function useGamificationProfile() {
  return useQuery({ queryKey: ["gamification", "profile"], queryFn: () => apiFetch<any>("/gamification/profile", { token: freshToken() }), enabled: isAuthenticated() });
}
export function useLeaderboard(sectionId?: string, period?: string) {
  const params = new URLSearchParams();
  if (sectionId) params.set("section_id", sectionId);
  if (period) params.set("period", period || "weekly");
  return useQuery({ queryKey: ["gamification", "leaderboard", sectionId, period], queryFn: () => apiFetch<any[]>(`/gamification/leaderboard?${params}`, { token: freshToken() }), enabled: isAuthenticated() });
}
export function useMyBadges() {
  return useQuery({ queryKey: ["gamification", "my-badges"], queryFn: () => apiFetch<any[]>("/gamification/my-badges", { token: freshToken() }), enabled: isAuthenticated() });
}
export function usePointsHistory() {
  return useQuery({ queryKey: ["gamification", "points"], queryFn: () => apiFetch<any[]>("/gamification/points-history", { token: freshToken() }), enabled: isAuthenticated() });
}

// ─── Live Quiz ───
export function useLiveQuizzes() {
  return useQuery({ queryKey: ["live-quiz"], queryFn: () => apiFetch<any[]>("/live-quiz/", { token: freshToken() }), enabled: isAuthenticated() });
}
export function useCreateLiveQuiz() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/live-quiz/", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["live-quiz"] }) });
}
export function useLiveQuizDetails(id: string) {
  return useQuery({ queryKey: ["live-quiz", id], queryFn: () => apiFetch<any>(`/live-quiz/${id}`, { token: freshToken() }), enabled: isAuthenticated() && !!id, refetchInterval: 3000 });
}
export function useJoinLiveQuiz() {
  return useMutation({ mutationFn: (data: { pin_code: string; team_name?: string }) => apiFetch("/live-quiz/join", { method: "POST", body: JSON.stringify(data), token: freshToken() }) });
}
export function useLiveQuizAction(quizId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (action: string) => apiFetch(`/live-quiz/${quizId}/${action}`, { method: "POST", token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["live-quiz", quizId] }) });
}
export function useSubmitLiveAnswer(quizId: string) {
  return useMutation({ mutationFn: (data: { question_index: number; answer: string }) => apiFetch(`/live-quiz/${quizId}/answer`, { method: "POST", body: JSON.stringify(data), token: freshToken() }) });
}
export function useLiveLeaderboard(quizId: string) {
  return useQuery({ queryKey: ["live-quiz", quizId, "leaderboard"], queryFn: () => apiFetch<any>(`/live-quiz/${quizId}/leaderboard`, { token: freshToken() }), enabled: isAuthenticated() && !!quizId, refetchInterval: 2000 });
}

// ─── Question Bank ───
export function useQuestionBanks() {
  return useQuery({ queryKey: ["question-bank"], queryFn: () => apiFetch<any[]>("/question-bank/", { token: freshToken() }), enabled: isAuthenticated() });
}
export function useCreateQuestionBank() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/question-bank/", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["question-bank"] }) });
}
export function useQuestionBankItems(bankId: string) {
  return useQuery({ queryKey: ["question-bank", bankId, "items"], queryFn: () => apiFetch<any[]>(`/question-bank/${bankId}/items`, { token: freshToken() }), enabled: isAuthenticated() && !!bankId });
}
export function useAddBankItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ bankId, ...data }: any) => apiFetch(`/question-bank/${bankId}/items`, { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["question-bank"] }) });
}
export function useGenerateExamFromBank() {
  return useMutation({ mutationFn: (data: any) => apiFetch("/question-bank/generate-exam", { method: "POST", body: JSON.stringify(data), token: freshToken() }) });
}

// ─── Messaging ───
export function useConversations() {
  return useQuery({ queryKey: ["messaging", "conversations"], queryFn: () => apiFetch<any[]>("/messaging/conversations", { token: freshToken() }), enabled: isAuthenticated() });
}
export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/messaging/conversations", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["messaging"] }) });
}
export function useMessages(convId: string) {
  return useQuery({ queryKey: ["messaging", "messages", convId], queryFn: () => apiFetch<any[]>(`/messaging/conversations/${convId}/messages`, { token: freshToken() }), enabled: isAuthenticated() && !!convId, refetchInterval: 5000 });
}
export function useSendMessage(convId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { content: string }) => apiFetch(`/messaging/conversations/${convId}/messages`, { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["messaging", "messages", convId] }) });
}
export function useAnnouncements(sectionId?: string) {
  const qs = sectionId ? `?section_id=${sectionId}` : "";
  return useQuery({ queryKey: ["messaging", "announcements", sectionId], queryFn: () => apiFetch<any[]>(`/messaging/announcements${qs}`, { token: freshToken() }), enabled: isAuthenticated() });
}
export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/messaging/announcements", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["messaging", "announcements"] }) });
}
export function useForums(sectionId?: string) {
  const qs = sectionId ? `?section_id=${sectionId}` : "";
  return useQuery({ queryKey: ["messaging", "forums", sectionId], queryFn: () => apiFetch<any[]>(`/messaging/forums${qs}`, { token: freshToken() }), enabled: isAuthenticated() });
}
export function useForumPosts(forumId: string) {
  return useQuery({ queryKey: ["messaging", "forums", forumId, "posts"], queryFn: () => apiFetch<any[]>(`/messaging/forums/${forumId}/posts`, { token: freshToken() }), enabled: isAuthenticated() && !!forumId });
}
export function useCreateForumPost(forumId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { content: string; parent_id?: string }) => apiFetch(`/messaging/forums/${forumId}/posts`, { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["messaging", "forums", forumId] }) });
}

// ─── Flashcards ───
export function useFlashcardSets() {
  return useQuery({ queryKey: ["flashcards", "sets"], queryFn: () => apiFetch<any[]>("/flashcards/sets", { token: freshToken() }), enabled: isAuthenticated() });
}
export function useCreateFlashcardSet() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/flashcards/sets", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["flashcards"] }) });
}
export function useFlashcardSetDetail(setId: string) {
  return useQuery({ queryKey: ["flashcards", "sets", setId], queryFn: () => apiFetch<any>(`/flashcards/sets/${setId}`, { token: freshToken() }), enabled: isAuthenticated() && !!setId });
}
export function useStudyCards(setId: string) {
  return useQuery({ queryKey: ["flashcards", "study", setId], queryFn: () => apiFetch<any[]>(`/flashcards/sets/${setId}/study`, { token: freshToken() }), enabled: isAuthenticated() && !!setId });
}
export function useReviewCard() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ cardId, quality }: { cardId: string; quality: number }) => apiFetch(`/flashcards/cards/${cardId}/review`, { method: "POST", body: JSON.stringify({ quality }), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["flashcards"] }) });
}
export function useGenerateFlashcards() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/flashcards/generate", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["flashcards"] }) });
}

// ─── Gradebook ───
export function useGradingPeriods(sectionId: string) {
  return useQuery({ queryKey: ["gradebook", "periods", sectionId], queryFn: () => apiFetch<any[]>(`/gradebook/periods?section_id=${sectionId}`, { token: freshToken() }), enabled: isAuthenticated() && !!sectionId });
}
export function useCreateGradingPeriod() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/gradebook/periods", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["gradebook"] }) });
}
export function useGradebookSummary(sectionId: string) {
  return useQuery({ queryKey: ["gradebook", "summary", sectionId], queryFn: () => apiFetch<any[]>(`/gradebook/summary/${sectionId}`, { token: freshToken() }), enabled: isAuthenticated() && !!sectionId });
}
export function useCreateGradebookEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/gradebook/entries", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["gradebook"] }) });
}
export function useSyncGradebook(sectionId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => apiFetch(`/gradebook/sync/${sectionId}`, { method: "POST", token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["gradebook"] }) });
}
export function useGradebookConfig(sectionId: string) {
  return useQuery({ queryKey: ["gradebook", "config", sectionId], queryFn: () => apiFetch<any>(`/gradebook/config/${sectionId}`, { token: freshToken() }), enabled: isAuthenticated() && !!sectionId });
}

// ─── Peer Review ───
export function usePeerReviewAssignments(examId?: string) {
  const qs = examId ? `?exam_id=${examId}` : "";
  return useQuery({ queryKey: ["peer-review", "assignments", examId], queryFn: () => apiFetch<any[]>(`/peer-review/assignments${qs}`, { token: freshToken() }), enabled: isAuthenticated() });
}
export function useCreatePeerReview() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/peer-review/assignments", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["peer-review"] }) });
}
export function useMyPeerReviews() {
  return useQuery({ queryKey: ["peer-review", "my-reviews"], queryFn: () => apiFetch<any[]>("/peer-review/my-reviews", { token: freshToken() }), enabled: isAuthenticated() });
}
export function useSubmitPeerReview() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ reviewId, ...data }: any) => apiFetch(`/peer-review/reviews/${reviewId}/submit`, { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["peer-review"] }) });
}

// ─── Certificates ───
export function useCertificateTemplates() {
  return useQuery({ queryKey: ["certificates", "templates"], queryFn: () => apiFetch<any[]>("/certificates/templates", { token: freshToken() }), enabled: isAuthenticated() });
}
export function useCreateCertificateTemplate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/certificates/templates", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["certificates"] }) });
}
export function useMyCertificates() {
  return useQuery({ queryKey: ["certificates", "my"], queryFn: () => apiFetch<any[]>("/certificates/my", { token: freshToken() }), enabled: isAuthenticated() });
}
export function useIssueCertificate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/certificates/issue", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["certificates"] }) });
}
export function useVerifyCertificate(code: string) {
  return useQuery({ queryKey: ["certificates", "verify", code], queryFn: () => apiFetch<any>(`/certificates/verify/${code}`), enabled: !!code });
}

// ─── Analytics ───
export function useExamAnalytics(examId: string) {
  return useQuery({ queryKey: ["analytics", "exam", examId], queryFn: () => apiFetch<any>(`/analytics/exam/${examId}`, { token: freshToken() }), enabled: isAuthenticated() && !!examId });
}
export function useAtRiskStudents(sectionId: string) {
  return useQuery({ queryKey: ["analytics", "at-risk", sectionId], queryFn: () => apiFetch<any[]>(`/analytics/at-risk?section_id=${sectionId}`, { token: freshToken() }), enabled: isAuthenticated() && !!sectionId });
}

// ─── Parent Portal ───
export function useParentChildren() {
  return useQuery({ queryKey: ["parent", "children"], queryFn: () => apiFetch<any[]>("/parent/children", { token: freshToken() }), enabled: isAuthenticated() });
}
export function useLinkChild() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { student_email: string; relationship: string }) => apiFetch("/parent/link", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["parent"] }) });
}
export function useParentDashboard() {
  return useQuery({ queryKey: ["parent", "dashboard"], queryFn: () => apiFetch<any>("/parent/dashboard", { token: freshToken() }), enabled: isAuthenticated() });
}
export function useChildProgress(studentId: string) {
  return useQuery({ queryKey: ["parent", "child", studentId], queryFn: () => apiFetch<any>(`/parent/child/${studentId}/progress`, { token: freshToken() }), enabled: isAuthenticated() && !!studentId });
}

// ─── Plagiarism ───
export function useRunPlagiarismCheck() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { exam_id: string }) => apiFetch("/plagiarism/check", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["plagiarism"] }) });
}
export function usePlagiarismResults(examId: string) {
  return useQuery({ queryKey: ["plagiarism", examId], queryFn: () => apiFetch<any[]>(`/plagiarism/results/${examId}`, { token: freshToken() }), enabled: isAuthenticated() && !!examId });
}

// ─── LTI ───
export function useLTIRegistrations() {
  return useQuery({ queryKey: ["lti", "registrations"], queryFn: () => apiFetch<any[]>("/lti/registrations", { token: freshToken() }), enabled: isAuthenticated() });
}
export function useCreateLTIRegistration() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => apiFetch("/lti/registrations", { method: "POST", body: JSON.stringify(data), token: freshToken() }), onSuccess: () => qc.invalidateQueries({ queryKey: ["lti"] }) });
}

// File preview
export function useReferencePreview(examId: string) {
  return useQuery({
    queryKey: ["exam", examId, "reference-preview"],
    queryFn: () => apiFetch<any>(`/profesor/exams/${examId}/reference-preview`, { token: freshToken() }),
    enabled: isAuthenticated() && !!examId,
  });
}

export function useStudentExamPreview(studentExamId: string) {
  return useQuery({
    queryKey: ["student-exam", studentExamId, "preview"],
    queryFn: () => apiFetch<any>(`/profesor/student-exams/${studentExamId}/preview`, { token: freshToken() }),
    enabled: isAuthenticated() && !!studentExamId,
  });
}
