"use client";

import { useNotifications, useUnreadCount } from "@/lib/api-hooks";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificacionesPage() {
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  const qc = useQueryClient();
  const unreadCount = unreadData?.count || 0;

  const markAsRead = async (id: string) => {
    const token = getTokens().access;
    if (!token) return;
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH", token });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
    } catch { /* non-critical */ }
  };

  const markAllAsRead = async () => {
    const token = getTokens().access;
    if (!token) return;
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH", token });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread"] });
    } catch { /* non-critical */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notificaciones</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : notifications?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium mb-1">Sin notificaciones</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Recibirás notificaciones cuando haya actividad relevante</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications?.map((n: any) => (
            <Card
              key={n.id}
              className={`transition-colors ${n.is_read ? "opacity-60" : "cursor-pointer hover:border-indigo-200"}`}
              onClick={() => !n.is_read && markAsRead(n.id)}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{n.title}</p>
                    {n.message && <p className="text-sm text-slate-500 dark:text-slate-400">{n.message}</p>}
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(n.created_at).toLocaleString("es-PE")}</p>
                  </div>
                  {!n.is_read && (
                    <span className="text-xs text-indigo-600 font-medium whitespace-nowrap mt-1">Nueva</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
