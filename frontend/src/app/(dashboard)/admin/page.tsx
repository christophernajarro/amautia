"use client";

import { useAdminStats } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, BookOpen, FileText, CreditCard, DollarSign, CheckCircle, Clock } from "lucide-react";

const statCards = [
  { key: "total_users", label: "Usuarios totales", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { key: "total_profesores", label: "Profesores", icon: GraduationCap, color: "text-violet-600", bg: "bg-violet-50" },
  { key: "total_alumnos", label: "Alumnos", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "total_exams", label: "Exámenes", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
  { key: "total_corrections", label: "Correcciones", icon: CheckCircle, color: "text-rose-600", bg: "bg-rose-50" },
  { key: "total_revenue", label: "Ingresos (S/)", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
  { key: "active_subscriptions", label: "Suscripciones activas", icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" },
  { key: "pending_payments", label: "Pagos pendientes", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Panel de administración de Amautia</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900">
                      {card.key === "total_revenue"
                        ? `S/ ${(stats as any)?.[card.key] || 0}`
                        : (stats as any)?.[card.key] || 0}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">{card.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Actividad reciente</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Sin actividad reciente registrada.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pagos pendientes</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-20" /> : (
              (stats as any)?.pending_payments === 0 ? (
                <p className="text-sm text-slate-500">No hay pagos pendientes de verificación.</p>
              ) : (
                <p className="text-sm text-orange-600 font-medium">
                  {(stats as any)?.pending_payments} pagos esperando verificación
                </p>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
