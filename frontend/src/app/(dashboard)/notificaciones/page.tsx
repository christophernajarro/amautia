"use client";

import { useState, useMemo } from "react";
import { useNotifications } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, BellOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";

export default function NotificacionesPage() {
  const { data: notifications, isLoading, mutate } = useNotifications() as any;
  const [filter, setFilter] = useState<"todas" | "no-leidas">("todas");

  const filtered = useMemo(() => {
    if (!notifications) return [];
    if (filter === "no-leidas") return notifications.filter((n: any) => !n.is_read);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications?.filter((n: any) => !n.is_read)?.length || 0;

  const markAllRead = async () => {
    const token = getTokens().access;
    if (!token) return;
    await apiFetch("/notifications/read-all", { token, method: "PATCH" });
    if (mutate) mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notificaciones</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilter("todas")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === "todas" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter("no-leidas")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            filter === "no-leidas" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          No leídas {unreadCount > 0 && <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <BellOff className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium mb-1">
              {filter === "no-leidas" ? "Todo al día" : "Sin notificaciones"}
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              {filter === "no-leidas"
                ? "No tienes notificaciones pendientes de leer. ¡Buen trabajo!"
                : "Recibirás notificaciones cuando haya actividad relevante en tus clases y exámenes."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n: any) => (
            <Card key={n.id} className={n.is_read ? "opacity-60" : ""}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-indigo-600 mt-2 shrink-0" />}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{n.title}</p>
                    {n.message && <p className="text-sm text-slate-500">{n.message}</p>}
                    <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString("es-PE")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
