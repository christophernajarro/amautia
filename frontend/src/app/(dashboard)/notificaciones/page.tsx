"use client";

import { useNotifications, useUnreadCount } from "@/lib/api-hooks";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  CheckCheck,
  FileText,
  AlertCircle,
  CheckCircle,
  Zap,
  Award,
  CreditCard,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Icon + color mapping per notification type                        */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  exam_corrected:   { icon: FileText,    color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40" },
  correction_error: { icon: AlertCircle, color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40" },
  published:        { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40" },
  correction:       { icon: Zap,         color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40" },
  certificate:      { icon: Award,       color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40" },
  payment_approved: { icon: CreditCard,  color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40" },
  payment_rejected: { icon: CreditCard,  color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40" },
  welcome:          { icon: UserPlus,    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40" },
  new_exam:         { icon: FileText,    color: "text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40" },
};

const DEFAULT_CONFIG = { icon: Bell, color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800" };

function getTypeConfig(type?: string) {
  if (!type) return DEFAULT_CONFIG;
  return TYPE_CONFIG[type] ?? DEFAULT_CONFIG;
}

/* ------------------------------------------------------------------ */
/*  Relative time helper (Spanish)                                    */
/* ------------------------------------------------------------------ */

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "Hace un momento";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return new Date(dateStr).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

export default function NotificacionesPage() {
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  const qc = useQueryClient();
  const unreadCount = unreadData?.count || 0;

  /* ---- Mark single notification as read ---- */
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => {
      const token = getTokens().access;
      return apiFetch(`/notifications/${id}/read`, { method: "PATCH", token: token! });
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      await qc.cancelQueries({ queryKey: ["notifications", "unread"] });
      const previousNotifications = qc.getQueryData<any[]>(["notifications"]);
      const previousUnread = qc.getQueryData<{ count: number }>(["notifications", "unread"]);
      qc.setQueryData<any[]>(["notifications"], (old) =>
        old?.map((n) => n.id === id ? { ...n, is_read: true } : n)
      );
      qc.setQueryData<{ count: number }>(["notifications", "unread"], (old) =>
        old ? { count: Math.max(0, old.count - 1) } : old
      );
      return { previousNotifications, previousUnread };
    },
    onError: (_err, _id, context) => {
      qc.setQueryData(["notifications"], context?.previousNotifications);
      qc.setQueryData(["notifications", "unread"], context?.previousUnread);
      toast.error("Error al marcar notificacion como leida");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
    },
  });

  /* ---- Mark all as read ---- */
  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      const token = getTokens().access;
      return apiFetch("/notifications/read-all", { method: "PATCH", token: token! });
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      await qc.cancelQueries({ queryKey: ["notifications", "unread"] });
      const previousNotifications = qc.getQueryData<any[]>(["notifications"]);
      const previousUnread = qc.getQueryData<{ count: number }>(["notifications", "unread"]);
      qc.setQueryData<any[]>(["notifications"], (old) =>
        old?.map((n) => ({ ...n, is_read: true }))
      );
      qc.setQueryData<{ count: number }>(["notifications", "unread"], { count: 0 });
      return { previousNotifications, previousUnread };
    },
    onError: (_err, _vars, context) => {
      qc.setQueryData(["notifications"], context?.previousNotifications);
      qc.setQueryData(["notifications", "unread"], context?.previousUnread);
      toast.error("Error al marcar todas como leidas");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
    },
  });

  const markAsRead = (id: string) => markAsReadMutation.mutate(id);
  const markAllAsRead = () => markAllAsReadMutation.mutate();

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Notificaciones
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {unreadCount} sin leer
            </p>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950 dark:hover:border-indigo-700"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todo como leido
          </Button>
        )}
      </div>

      {/* ---- Loading skeleton ---- */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications?.length === 0 ? (
        /* ---- Empty state ---- */
        <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 ring-1 ring-foreground/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-5">
            <Bell className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Sin notificaciones
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
            Recibiras notificaciones cuando haya actividad relevante en tu cuenta
          </p>
        </div>
      ) : (
        /* ---- Notification list ---- */
        <div className="space-y-4">
          {notifications?.map((n: any) => {
            const isUnread = !n.is_read;
            const { icon: Icon, color: iconColor } = getTypeConfig(n.type);

            return (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => isUnread && markAsRead(n.id)}
                onKeyDown={(e) => {
                  if (isUnread && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    markAsRead(n.id);
                  }
                }}
                className={[
                  "group relative flex items-start gap-4 rounded-xl p-4 ring-1 transition-all duration-200",
                  isUnread
                    ? "border-l-[3px] border-l-indigo-500 bg-indigo-50/60 ring-indigo-200/60 dark:bg-indigo-950/30 dark:ring-indigo-800/40 dark:border-l-indigo-400 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:ring-indigo-300/80 dark:hover:ring-indigo-700/60 hover:shadow-sm"
                    : "border-l-[3px] border-l-transparent bg-card ring-foreground/10 opacity-75 hover:opacity-90",
                ].join(" ")}
              >
                {/* Icon */}
                <div
                  className={[
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-200",
                    iconColor,
                    isUnread ? "group-hover:scale-105" : "",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={[
                        "text-sm leading-snug",
                        isUnread
                          ? "font-semibold text-slate-900 dark:text-slate-100"
                          : "font-medium text-slate-600 dark:text-slate-400",
                      ].join(" ")}
                    >
                      {n.title}
                    </p>

                    {isUnread && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 flex-shrink-0">
                        Nueva
                      </span>
                    )}
                  </div>

                  {n.message && (
                    <p
                      className={[
                        "mt-1 text-sm leading-relaxed",
                        isUnread
                          ? "text-slate-600 dark:text-slate-300"
                          : "text-slate-500 dark:text-slate-500",
                      ].join(" ")}
                    >
                      {n.message}
                    </p>
                  )}

                  <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                    {relativeTime(n.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
