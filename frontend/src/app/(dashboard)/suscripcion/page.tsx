// @ts-nocheck
"use client";

import { useMySubscription, usePublicPlans } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Star, CreditCard } from "lucide-react";

export default function SuscripcionPage() {
  const { data: subscription, isLoading: loadingSub } = useMySubscription();
  const { data: plans, isLoading: loadingPlans } = usePublicPlans();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Mi Suscripción</h1>

      <Card>
        <CardHeader><CardTitle>Plan actual</CardTitle></CardHeader>
        <CardContent>
          {loadingSub ? <Skeleton className="h-16" /> : subscription?.plan_name ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{subscription.plan_name}</p>
                <Badge variant={subscription.status === "active" ? "default" : "secondary"}>{subscription.status}</Badge>
                <p className="text-sm text-slate-500 mt-1">
                  Vence: {new Date(subscription.expires_at).toLocaleDateString("es-PE")}
                </p>
              </div>
              <div className="text-right text-sm text-slate-500">
                <p>Correcciones: {subscription.corrections_used}</p>
                <p>Generaciones: {subscription.generations_used}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-slate-300" />
              <div>
                <p className="font-medium">Plan Gratis</p>
                <p className="text-sm text-slate-500">5 correcciones/mes, 2 generaciones/mes</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold">Planes disponibles</h2>
      {loadingPlans ? <Skeleton className="h-48" /> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans?.map((plan: any) => (
            <Card key={plan.id} className={plan.slug === "pro" ? "ring-2 ring-indigo-600" : ""}>
              {plan.slug === "pro" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600"><Star className="h-3 w-3 mr-1" />Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <div><span className="text-2xl font-bold">S/ {plan.price_monthly}</span><span className="text-slate-500">/mes</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-4">
                  {[
                    plan.max_corrections_month ? `${plan.max_corrections_month} correcciones/mes` : "Ilimitado",
                    plan.max_students ? `${plan.max_students} alumnos` : "Ilimitado",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" />{f}</li>
                  ))}
                </ul>
                <Button variant={plan.slug === "pro" ? "default" : "outline"} className={`w-full ${plan.slug === "pro" ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}>
                  {plan.price_monthly === 0 ? "Plan actual" : "Elegir plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
