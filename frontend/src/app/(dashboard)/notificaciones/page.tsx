"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificacionesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notificaciones</h1>
        <p className="text-muted-foreground">Centro de notificaciones</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mb-3" />
          <p className="font-medium text-lg">No hay notificaciones</p>
          <p className="text-sm">Las notificaciones aparecerán aquí</p>
        </CardContent>
      </Card>
    </div>
  );
}
