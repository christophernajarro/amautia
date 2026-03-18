"use client";

import { useProfesorDashboard } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, FileText, CheckCircle, Plus, Sparkles, ArrowRight, Layers, Upload } from "lucide-react";
import { ProgressRing } from "@/components/charts/progress-ring";
import { ScoreDistribution } from "@/components/charts/score-distribution";
import Link from "next/link";
import { UsageQuota } from "@/components/usage-quota";

export default function ProfesorDashboard() {
  const { data: stats, isLoading } = useProfesorDashboard();
  const isNewUser = !isLoading && stats && (stats as any)?.total_subjects === 0;

  const kpis = [
    { label: "Materias", value: (stats as any)?.total_subjects || 0, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/50", href: "/profesor/materias" },
    { label: "Secciones", value: (stats as any)?.total_sections || 0, icon: FileText, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/50", href: "/profesor/materias" },
    { label: "Alumnos", value: (stats as any)?.total_students || 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/50", href: "/profesor/alumnos" },
    { label: "Exámenes", value: (stats as any)?.total_exams || 0, icon: CheckCircle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/50", href: "/profesor/examenes" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mi Panel</h1>
          <p className="text-slate-500 dark:text-slate-400">Bienvenido de vuelta, profesor</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/profesor/examenes/nuevo" className="flex-1 sm:flex-initial">
            <Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />Nuevo examen
            </Button>
          </Link>
          <Link href="/profesor/generar" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full sm:w-auto">
              <Sparkles className="h-4 w-4 mr-2" />Generar con IA
            </Button>
          </Link>
        </div>
      </div>

      <UsageQuota />

      {isNewUser && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 mb-2">Bienvenido a Amautia</h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-5">Sigue estos pasos para corregir tu primer examen con IA:</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link href="/profesor/materias">
                <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900 hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Crear materia</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Organiza tus cursos y agrega secciones</p>
                  </div>
                </div>
              </Link>
              <Link href="/profesor/examenes/nuevo">
                <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900 hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Crear examen</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sube tu examen de referencia con respuestas</p>
                  </div>
                </div>
              </Link>
              <Link href="/profesor/examenes">
                <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900 hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Corregir</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sube exámenes de alumnos y la IA los corrige</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                  <div>
                    {isLoading ? <Skeleton className="h-8 w-12" /> : (
                      <p className="text-2xl font-bold">{kpi.value}</p>
                    )}
                    <p className="text-sm text-slate-500 dark:text-slate-400">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/profesor/examenes/nuevo">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-indigo-100 bg-indigo-50/50 dark:border-indigo-900 dark:bg-indigo-950/30">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Plus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-indigo-900 dark:text-indigo-200">Crear Examen</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">Nuevo examen manual</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/profesor/generar">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-violet-100 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/30">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-violet-900 dark:text-violet-200">Generar con IA</p>
                <p className="text-xs text-violet-600 dark:text-violet-400">Examen automático</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/profesor/alumnos/importar">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-emerald-100 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">Importar Alumnos</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">CSV masivo</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribución de notas</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats as any)?.score_distribution ? (
              <ScoreDistribution data={(stats as any).score_distribution} />
            ) : (stats as any)?.total_exams > 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Datos de distribución no disponibles aún</p>
            ) : (
              <div className="flex flex-col items-center py-8">
                <FileText className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">Crea tu primer examen para ver estadísticas</p>
                <Link href="/profesor/examenes/nuevo">
                  <Button variant="link" className="text-indigo-600 dark:text-indigo-400 mt-2">
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
            <ProgressRing value={(stats as any)?.average_score ?? 0} label="Promedio de clase" />
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
                <Link key={exam.id} href={`/profesor/examenes/${exam.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-sm">{exam.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(exam.created_at).toLocaleDateString("es-PE")}</p>
                    </div>
                    <Badge variant={exam.status === "corrected" ? "default" : "secondary"}>
                      {{ draft: "Borrador", active: "Activo", ready: "Listo", corrected: "Corregido", graded: "Calificado", published: "Publicado" }[exam.status as string] || exam.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No hay exámenes aún</p>
              <div className="flex gap-2">
                <Link href="/profesor/examenes/nuevo">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-1" />Crear examen
                  </Button>
                </Link>
                <Link href="/profesor/generar">
                  <Button size="sm" variant="outline">
                    <Sparkles className="h-4 w-4 mr-1" />Generar con IA
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
