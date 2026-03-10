"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard } from "lucide-react";

export default function SuscripcionPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Suscripción</h1>
        <p className="text-muted-foreground">Gestiona tu plan y pagos</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Plan Actual</CardTitle>
            <Badge>Gratis</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>5 correcciones/mes (0 usadas)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>2 generaciones/mes (0 usadas)</span>
          </div>
          <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">
            <CreditCard className="h-4 w-4 mr-1" /> Mejorar Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
