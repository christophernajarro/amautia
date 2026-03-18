"use client";

import { useProfesorDashboard, useProfesorExams } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreDistribution } from "@/components/charts/score-distribution";
import { ProgressRing } from "@/components/charts/progress-ring";
import { ActivityChart } from "@/components/charts/activity-chart";
import { BarChart3, Users, FileText, CheckCircle, CalendarOff } from "lucide-react";

export default function EstadisticasPage() {
  const { data: stats, isLoading } = useProfesorDashboard();
  const { data: exams } = useProfesorExams();

  const correctedExams = ((exams as any[]) || []).filter((e: any) => e.status === "corrected").length;
  const correctionRate = (exams as any[])?.length ? Math.round((correctedExams / (exams as any[]).length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-slate-500 dark:text-slate-400">Rendimiento general de tus alumnos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{(stats as any)?.total_exams || 0}</p>}
              <p className="text-sm text-slate-500">Exámenes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{correctedExams}</p>
              <p className="text-sm text-slate-500">Corregidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{(stats as any)?.total_students || 0}</p>}
              <p className="text-sm text-slate-500">Alumnos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{correctionRate}%</p>
              <p className="text-sm text-slate-500">Tasa corrección</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Actividad mensual</CardTitle></CardHeader>
          <CardContent>
            {(stats as any)?.weekly_activity?.length > 0 ? (
              <ActivityChart data={(stats as any).weekly_activity} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                <CalendarOff className="h-10 w-10 mb-2" />
                <p className="text-sm font-medium">Sin datos de actividad</p>
                <p className="text-xs mt-1">Los datos aparecerán cuando haya más correcciones</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Distribución de notas</CardTitle></CardHeader>
          <CardContent>
            <ScoreDistribution data={(stats as any)?.score_distribution || []} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Promedio general</CardTitle></CardHeader>
          <CardContent className="flex justify-center py-4">
            <ProgressRing value={(stats as any)?.average_score ?? 0} color="#4f46e5" label="Todas las secciones" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tasa de aprobación</CardTitle></CardHeader>
          <CardContent className="flex justify-center py-4">
            <ProgressRing value={(stats as any)?.pass_rate ?? 0} color="#10b981" label="Nota ≥ 11" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Exámenes corregidos</CardTitle></CardHeader>
          <CardContent className="flex justify-center py-4">
            <ProgressRing value={correctionRate} color="#8b5cf6" label="Del total" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
