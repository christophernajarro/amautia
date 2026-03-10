"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function AlumnoExamenesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mis Exámenes</h1>
        <p className="text-muted-foreground">Exámenes corregidos y calificaciones</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3" />
          <p className="font-medium text-lg">No hay exámenes corregidos</p>
          <p className="text-sm">Tus exámenes corregidos aparecerán aquí</p>
        </CardContent>
      </Card>
    </div>
  );
}
