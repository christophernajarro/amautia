"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function EstadisticasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Estadísticas</h1>
        <p className="text-muted-foreground">Analiza el rendimiento de tus alumnos</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-3" />
          <p className="font-medium text-lg">Sin datos todavía</p>
          <p className="text-sm">Las estadísticas aparecerán cuando tengas exámenes corregidos</p>
        </CardContent>
      </Card>
    </div>
  );
}
