// @ts-nocheck
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function EstadisticasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-slate-500">Rendimiento de tus alumnos por materia y sección</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <BarChart3 className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium mb-1">Estadísticas disponibles pronto</h3>
          <p className="text-sm text-slate-500 text-center max-w-md">
            Cuando tengas exámenes corregidos, aquí verás gráficos de rendimiento por materia, sección y alumno.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
