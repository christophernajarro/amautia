
"use client";

import { useNotifications } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";

export default function NotificacionesPage() {
  const { data: notifications, isLoading } = useNotifications();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Notificaciones</h1>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : notifications?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Bell className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">Sin notificaciones</h3>
            <p className="text-sm text-slate-500">Recibirás notificaciones cuando haya actividad relevante</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications?.map((n: any) => (
            <Card key={n.id} className={n.is_read ? "opacity-60" : ""}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-indigo-600 mt-2" />}
                  <div>
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
