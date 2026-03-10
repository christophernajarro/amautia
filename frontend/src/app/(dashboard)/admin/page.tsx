"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CreditCard, BarChart3 } from "lucide-react";

const stats = [
  { title: "Usuarios Totales", value: "0", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Exámenes Corregidos", value: "0", icon: FileText, color: "text-green-600", bg: "bg-green-50" },
  { title: "Pagos Pendientes", value: "0", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
  { title: "Correcciones Hoy", value: "0", icon: BarChart3, color: "text-violet-600", bg: "bg-violet-50" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
        <p className="text-muted-foreground">Resumen general de la plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pagos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay pagos pendientes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
