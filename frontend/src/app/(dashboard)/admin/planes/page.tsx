"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

const defaultPlans = [
  { name: "Gratis", price: "S/0", slug: "gratis", corrections: 5, generations: 2, active: true },
  { name: "Básico", price: "S/29", slug: "basico", corrections: 50, generations: 20, active: true },
  { name: "Pro", price: "S/79", slug: "pro", corrections: 300, generations: null, active: true },
  { name: "Enterprise", price: "S/199", slug: "enterprise", corrections: null, generations: null, active: true },
];

export default function PlanesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planes</h1>
          <p className="text-muted-foreground">Gestiona los planes de suscripción</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">Nuevo Plan</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {defaultPlans.map((plan) => (
          <Card key={plan.slug}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <Badge variant={plan.active ? "default" : "secondary"}>
                  {plan.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                {plan.corrections ? `${plan.corrections} correcciones` : "Correcciones ilimitadas"}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                {plan.generations ? `${plan.generations} generaciones` : "Generaciones ilimitadas"}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3">Editar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
