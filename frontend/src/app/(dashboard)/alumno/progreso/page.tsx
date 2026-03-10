"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ProgresoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Progreso</h1>
        <p className="text-slate-500">Estadísticas y evolución de tu rendimiento</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <BarChart3 className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium mb-1">Aún no hay datos</h3>
          <p className="text-sm text-slate-500 text-center max-w-md">
            Cuando tengas exámenes corregidos, aquí verás gráficos de tu progreso, fortalezas y áreas de mejora.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
