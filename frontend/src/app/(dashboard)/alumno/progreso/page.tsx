"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ProgresoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Progreso</h1>
        <p className="text-muted-foreground">Seguimiento de tu rendimiento académico</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-3" />
          <p className="font-medium text-lg">Sin datos de progreso</p>
          <p className="text-sm">Tu progreso aparecerá cuando tengas exámenes corregidos</p>
        </CardContent>
      </Card>
    </div>
  );
}
