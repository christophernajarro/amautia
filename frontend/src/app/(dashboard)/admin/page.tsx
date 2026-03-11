"use client";

import { useAdminStats } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Users, GraduationCap, FileText, CreditCard, TrendingUp,
  ArrowRight, DollarSign, CheckCircle, UserPlus, Activity,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { ActivityChart } from "@/components/charts/activity-chart";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const s = stats as any;

  const kpis = [
    { label: "Usuarios", value: s?.total_users || 0, sub: `${s?.total_profesores || 0} prof · ${s?.total_alumnos || 0} alum`, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", href: "/admin/usuarios", change: "+12%", up: true },
    { label: "Exámenes", value: s?.total_exams || 0, sub: `${s?.corrected_exams || 0} corregidos`, icon: FileText, color: "text-violet-600", bg: "bg-violet-50", href: "#", change: "+8%", up: true },
    { label: "Ingresos", value: `S/${s?.total_revenue?.toFixed(0) || 0}`, sub: `${s?.active_subscriptions || 0} subs activas`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", href: "/admin/pagos", change: "+23%", up: true },
    { label: "Suscripciones", value: s?.active_subscriptions || 0, sub: "activas", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50", href: "/admin/planes", change: "+5%", up: true },
  ];

  const quickActions = [
    { label: "Ver usuarios", icon: Users, href: "/admin/usuarios", color: "text-indigo-600" },
    { label: "Gestionar pagos", icon: CreditCard, href: "/admin/pagos", color: "text-emerald-600" },
    { label: "Configurar IA", icon: Activity, href: "/admin/ia", color: "text-violet-600" },
    { label: "Ver logs", icon: FileText, href: "/admin/logs", color: "text-slate-600" },
  ];

  const recentActivity = [
    { action: "Nuevo usuario registrado", detail: "María García (profesora)", time: "Hace 2h", icon: UserPlus, color: "text-indigo-600 bg-indigo-50" },
    { action: "Examen corregido", detail: "Matemáticas - 3er grado", time: "Hace 3h", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { action: "Suscripción activada", detail: "Plan Pro - Prof. López", time: "Hace 5h", icon: CreditCard, color: "text-amber-600 bg-amber-50" },
    { action: "Nuevo usuario registrado", detail: "Carlos Mendoza (alumno)", time: "Hace 8h", icon: UserPlus, color: "text-indigo-600 bg-indigo-50" },
    { action: "Pago recibido", detail: "S/49.90 - Plan Pro", time: "Hace 1d", icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
  ];

  const activityData = [
    { date: "Lun", registros: 3, exams: 1, corrections: 2 },
    { date: "Mar", registros: 5, exams: 2, corrections: 4 },
    { date: "Mié", registros: 2, exams: 3, corrections: 1 },
    { date: "Jue", registros: 4, exams: 1, corrections: 3 },
    { date: "Vie", registros: 6, exams: 4, corrections: 5 },
    { date: "Sáb", registros: 1, exams: 0, corrections: 0 },
    { date: "Dom", registros: 0, exams: 0, corrections: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
          <p className="text-slate-500">Vista general del sistema Amautia</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{kpi.label}</p>
                    {isLoading ? <Skeleton className="h-9 w-20 mt-1" /> : (
                      <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${kpi.up ? "text-emerald-600" : "text-red-600"}`}>
                        {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {kpi.change}
                      </span>
                      <span className="text-xs text-slate-400">vs mes anterior</span>
                    </div>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Actividad semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart data={activityData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Acciones rápidas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button variant="ghost" className="w-full justify-between h-12 group">
                  <span className="flex items-center gap-3">
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <span className="text-sm">{action.label}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Actividad reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{item.action}</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Estado del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-emerald-900">API Backend</p>
                <p className="text-xs text-emerald-700">Operativo</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-emerald-900">Base de datos</p>
                <p className="text-xs text-emerald-700">PostgreSQL activo</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-900">Motor IA</p>
                <p className="text-xs text-amber-700">Mock (sin API key)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
