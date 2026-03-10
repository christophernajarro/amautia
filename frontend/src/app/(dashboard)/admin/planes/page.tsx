
"use client";

import { useAdminPlans } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Star } from "lucide-react";

export default function PlanesPage() {
  const { data: plans, isLoading } = useAdminPlans();

  if (isLoading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Planes</h1>
        <p className="text-slate-500">Gestión de planes de suscripción</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans?.map((plan: any) => (
          <Card key={plan.id} className={`relative ${plan.slug === "pro" ? "ring-2 ring-indigo-600" : ""}`}>
            {plan.slug === "pro" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-indigo-600"><Star className="h-3 w-3 mr-1" />Popular</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold">S/ {plan.price_monthly}</span>
                <span className="text-slate-500">/mes</span>
              </div>
              <p className="text-sm text-slate-500">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {plan.max_corrections_month ? `${plan.max_corrections_month} correcciones/mes` : "Correcciones ilimitadas"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {plan.max_students ? `${plan.max_students} alumnos` : "Alumnos ilimitados"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {plan.max_subjects ? `${plan.max_subjects} materias` : "Materias ilimitadas"}
                </li>
                {plan.has_tutor && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />Tutor IA ({plan.tutor_level})
                  </li>
                )}
                {plan.has_rubrics && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />Rúbricas
                  </li>
                )}
                {plan.has_analytics && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />Estadísticas avanzadas
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
