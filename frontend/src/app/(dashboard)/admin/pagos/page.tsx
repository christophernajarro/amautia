"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PagosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verificación de Pagos</h1>
        <p className="text-muted-foreground">Revisa y aprueba los comprobantes de pago</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pagos Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay pagos pendientes de verificación</p>
        </CardContent>
      </Card>
    </div>
  );
}
