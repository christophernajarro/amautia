"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Logs de Actividad</h1>
        <p className="text-muted-foreground">Historial de acciones en la plataforma</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay actividad registrada todavía
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
