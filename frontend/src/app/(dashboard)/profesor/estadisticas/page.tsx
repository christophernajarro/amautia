"use client";

import { useProfesorDashboard, useProfesorExams } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreDistribution } from "@/components/charts/score-distribution";
import { ProgressRing } from "@/components/charts/progress-ring";
import { ActivityChart } from "@/components/charts/activity-chart";
import { BarChart3, Users, FileText, CheckCircle } from "lucide-react";

const mockActivity = [
  { date: "Sem 1", exams: 1, corrections: 3 },
  { date: "Sem 2", exams: 2, corrections: 8 },
  { date: "Sem 3", exams: 1, corrections: 5 },
  { date: "Sem 4", exams: 3, corrections: 12 },
];

const mockScores = [
  { range: "0-5", count: 1 },
  { range: "6-10", count: 3 },
  { range: "11-13", count: 5 },
  { range: "14-16", count: 8 },
  { range: "17-18", count: 4 },
  { range: "19-20", count: 2 },
];

export default function EstadisticasPage() {
  const { data: stats, isLoading } = useProfesorDashboard();
  const { data: exams } = useProfesorExams();

  const correctedExams = ((exams as any[]) || []).filter((e: any) => e.status === "corrected").length;
  const correctionRate = (exams as any[])?.length ? Math.round((correctedExams / (exams as any[]).length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-slate-500">Rendimiento general de tus alumnos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{(stats as any)?.total_exams || 0}</p>}
              <p className="text-sm text-slate-500">Exámenes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{correctedExams}</p>
              <p className="text-sm text-slate-500">Corregidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{(stats as any)?.total_students || 0}</p>}
              <p className="text-sm text-slate-500">Alumnos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-amber-600" />
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
            <ActivityChart data={mockActivity} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Distribución de notas</CardTitle></CardHeader>
          <CardContent>
            <ScoreDistribution data={mockScores} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Promedio general</CardTitle></CardHeader>
          <CardContent className="flex justify-center py-4">
            <ProgressRing value={72} color="#4f46e5" label="Todas las secciones" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tasa de aprobación</CardTitle></CardHeader>
          <CardContent className="flex justify-center py-4">
            <ProgressRing value={85} color="#10b981" label="Nota ≥ 11" />
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
