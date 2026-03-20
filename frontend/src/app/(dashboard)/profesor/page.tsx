"use client";

import { useState, useEffect } from "react";
import { useProfesorDashboard } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, FileText, CheckCircle, Plus, Sparkles, ArrowRight, HelpCircle, Zap, Upload } from "lucide-react";
import { ProgressRing } from "@/components/charts/progress-ring";
import { ScoreDistribution } from "@/components/charts/score-distribution";
import Link from "next/link";
import { UsageQuota } from "@/components/usage-quota";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { useAuthStore } from "@/stores/auth-store";

export default function ProfesorDashboard() {
  const { data: stats, isLoading } = useProfesorDashboard();
  const isNewUser = !isLoading && stats && (stats as any)?.total_subjects === 0;
  const user = useAuthStore((s) => s.user);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoading && stats && (stats as any)?.total_subjects === 0 && !localStorage.getItem("onboarding_done")) {
      setShowOnboarding(true);
    }
  }, [isLoading, stats]);

  const kpis = [
    { label: "Materias", value: (stats as any)?.total_subjects || 0, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/50", href: "/profesor/materias" },
    { label: "Clases", value: (stats as any)?.total_sections || 0, icon: FileText, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/50", href: "/profesor/materias" },
    { label: "Alumnos", value: (stats as any)?.total_students || 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/50", href: "/profesor/alumnos" },
    { label: "Exámenes", value: (stats as any)?.total_exams || 0, icon: CheckCircle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/50", href: "/profesor/examenes" },
  ];

  return (
    <div className="space-y-6">
      <OnboardingWizard
        userName={user?.first_name || "Profesor"}
        open={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem("onboarding_done", "true");
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground">Mi Panel</h1>
          <p className="text-lg text-muted-foreground mt-2">Bienvenido de vuelta, profesor</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/profesor/examenes/nuevo" className="flex-1 sm:flex-initial">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto h-14 text-lg px-8">
              <Plus className="h-5 w-5 mr-2" />Nuevo examen
            </Button>
          </Link>
          <Link href="/profesor/generar" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full sm:w-auto h-14 text-lg px-8">
              <Sparkles className="h-5 w-5 mr-2" />Generar con IA
            </Button>
          </Link>
        </div>
      </div>

      {/* Plan + Quick Actions row */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <UsageQuota />
        <div className="flex flex-wrap gap-3 items-start">
          <Link href="/profesor/examenes/nuevo">
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/20 transition-colors cursor-pointer group">
              <Upload className="h-5 w-5 text-primary" />
              <div>
                <p className="font-bold text-sm text-foreground">Corregir examen</p>
                <p className="text-xs text-muted-foreground">Sube y corrige con IA</p>
              </div>
            </div>
          </Link>
          <Link href="/profesor/generar">
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 transition-colors cursor-pointer group">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <div>
                <p className="font-bold text-sm text-foreground">Generar examen</p>
                <p className="text-xs text-muted-foreground">Crea con IA en 1 min</p>
              </div>
            </div>
          </Link>
          <Link href="/profesor/quiz-en-vivo">
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 transition-colors cursor-pointer group">
              <Zap className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="font-bold text-sm text-foreground">Quiz en vivo</p>
                <p className="text-xs text-muted-foreground">Evalúa en tiempo real</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Hint banner for new users */}
      {isNewUser && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-200">¿Primera vez aquí?</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Empieza creando una materia en <Link href="/profesor/materias" className="underline font-semibold">Mis Cursos</Link>, luego ve a <Link href="/profesor/examenes/nuevo" className="underline font-semibold">Exámenes</Link> para subir y corregir tu primer examen con IA.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-7 w-7 ${kpi.color}`} />
                  </div>
                  <div>
                    {isLoading ? <Skeleton className="h-10 w-16" /> : (
                      <p className="text-3xl font-extrabold">{kpi.value}</p>
                    )}
                    <p className="text-base text-slate-500 dark:text-slate-400">{kpi.label}</p>
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
                      {{ draft: "Sin referencia", active: "Activo", ready: "Listo para corregir", corrected: "Corregido", graded: "Calificado", published: "Publicado" }[exam.status as string] || exam.status}
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
