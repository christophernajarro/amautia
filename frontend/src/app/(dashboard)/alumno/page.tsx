"use client";

import { useAlumnoDashboard } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { BookOpen, FileText, BarChart3, Brain, Trophy, Target, ArrowRight, TrendingUp, Minus, TrendingDown } from "lucide-react";
import { ProgressRing } from "@/components/charts/progress-ring";

export default function AlumnoDashboard() {
  const { data: stats, isLoading } = useAlumnoDashboard();

  const kpis = [
    { label: "Mis materias", value: (stats as any)?.total_subjects || 0, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/50", href: "/alumno/materias" },
    { label: "Exámenes", value: (stats as any)?.total_exams || 0, icon: FileText, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/50", href: "/alumno/examenes" },
    { label: "Promedio", value: `${(stats as any)?.average_score || 0}%`, icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/50", href: "/alumno/progreso" },
    { label: "Ejercicios", value: (stats as any)?.exercises_completed || 0, icon: Target, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/50", href: "/alumno/tutor" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mi Panel</h1>
          <p className="text-slate-500 dark:text-slate-400">Tu progreso de aprendizaje</p>
        </div>
        <div className="flex gap-2">
          <Link href="/alumno/unirse">
            <Button variant="outline">Unirme a clase</Button>
          </Link>
          <Link href="/alumno/tutor">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Brain className="h-4 w-4 mr-2" />Tutor IA
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                  <div>
                    {isLoading ? <Skeleton className="h-8 w-16 rounded" /> : (
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Últimos exámenes</CardTitle>
              <Link href="/alumno/examenes">
                <Button variant="ghost" size="sm">Ver todos <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 mb-2" />)
            ) : (stats as any)?.recent_exams?.length > 0 ? (
              <div className="space-y-3">
                {(stats as any).recent_exams.map((exam: any) => (
                  <Link key={exam.id} href={`/alumno/examenes/${exam.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-sm">{exam.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(exam.date).toLocaleDateString("es-PE")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {exam.score != null && (
                          <span className={`inline-flex items-center gap-1 text-sm font-bold ${exam.score >= 14 ? "text-emerald-600" : exam.score >= 11 ? "text-amber-600" : "text-red-600"}`}>
                            {exam.score >= 14 ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : exam.score >= 10 ? (
                              <Minus className="h-3.5 w-3.5" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5" />
                            )}
                            {exam.score}/20
                          </span>
                        )}
                        <Badge variant={exam.status === "corrected" ? "default" : "secondary"}>
                          {exam.status === "corrected" ? "Corregido" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">No tienes exámenes aún</p>
                <Link href="/alumno/unirse">
                  <Button variant="link" className="text-indigo-600 mt-2">
                    Únete a una clase <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mi progreso</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-4">
            <ProgressRing value={(stats as any)?.average_score || 0} label="Promedio general" />
            <div className="w-full space-y-2 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Ejercicios completados</span>
                <span className="font-medium">{(stats as any)?.exercises_completed || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Precisión</span>
                <span className="font-medium">{(stats as any)?.accuracy || 0}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Planes activos</span>
                <span className="font-medium">{(stats as any)?.active_plans || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/alumno/tutor">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-indigo-100 hover:border-indigo-200 dark:border-indigo-900 dark:hover:border-indigo-800">
            <CardContent className="pt-6 text-center">
              <Brain className="h-10 w-10 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Tutor IA</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pregunta sobre cualquier tema</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/alumno/progreso">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-emerald-100 hover:border-emerald-200 dark:border-emerald-900 dark:hover:border-emerald-800">
            <CardContent className="pt-6 text-center">
              <Trophy className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Mi progreso</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Estadísticas y logros</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/alumno/unirse">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-violet-100 hover:border-violet-200 dark:border-violet-900 dark:hover:border-violet-800">
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-10 w-10 text-violet-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Unirme a clase</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ingresa el código de tu profesor</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
