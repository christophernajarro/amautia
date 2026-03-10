"use client";

import { useProfesorDashboard } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, FileText, CheckCircle, Plus, Sparkles, ArrowRight } from "lucide-react";
import { ProgressRing } from "@/components/charts/progress-ring";
import { ScoreDistribution } from "@/components/charts/score-distribution";
import Link from "next/link";

const mockScores = [
  { range: "0-5", count: 0 },
  { range: "6-10", count: 2 },
  { range: "11-13", count: 4 },
  { range: "14-16", count: 6 },
  { range: "17-18", count: 3 },
  { range: "19-20", count: 1 },
];

export default function ProfesorDashboard() {
  const { data: stats, isLoading } = useProfesorDashboard();

  const kpis = [
    { label: "Materias", value: (stats as any)?.total_subjects || 0, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Secciones", value: (stats as any)?.total_sections || 0, icon: FileText, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Alumnos", value: (stats as any)?.total_students || 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Exámenes", value: (stats as any)?.total_exams || 0, icon: CheckCircle, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Panel</h1>
          <p className="text-slate-500">Bienvenido de vuelta, profesor</p>
        </div>
        <div className="flex gap-2">
          <Link href="/profesor/examenes/nuevo">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />Nuevo examen
            </Button>
          </Link>
          <Link href="/profesor/generar">
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />Generar con IA
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : (
                    <p className="text-2xl font-bold">{kpi.value}</p>
                  )}
                  <p className="text-sm text-slate-500">{kpi.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribución de notas</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats as any)?.total_exams > 0 ? (
              <ScoreDistribution data={mockScores} />
            ) : (
              <div className="flex flex-col items-center py-8">
                <FileText className="h-10 w-10 text-slate-200 mb-3" />
                <p className="text-slate-500 text-sm">Crea tu primer examen para ver estadísticas</p>
                <Link href="/profesor/examenes/nuevo">
                  <Button variant="link" className="text-indigo-600 mt-2">
                    Crear examen <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Promedio general</CardTitle></CardHeader>
          <CardContent className="flex justify-center py-4">
            <ProgressRing value={75} label="Promedio de clase" />
          </CardContent>
        </Card>
      </div>

      {/* Recent exams */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exámenes recientes</CardTitle>
            <Link href="/profesor/examenes">
              <Button variant="ghost" size="sm">Ver todos <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 mb-2" />)
          ) : (stats as any)?.recent_exams?.length > 0 ? (
            <div className="space-y-3">
              {(stats as any).recent_exams.map((exam: any) => (
                <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{exam.title}</p>
                    <p className="text-xs text-slate-500">{new Date(exam.created_at).toLocaleDateString("es-PE")}</p>
                  </div>
                  <Badge variant={exam.status === "corrected" ? "default" : "secondary"}>
                    {exam.status === "ready" ? "Listo" : exam.status === "corrected" ? "Corregido" : exam.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No hay exámenes aún</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
