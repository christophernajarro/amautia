"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRing } from "@/components/charts/progress-ring";
import { ScoreDistribution } from "@/components/charts/score-distribution";
import { Trophy, Target, Brain, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ProgresoPage() {
  const [progress, setProgress] = useState<any>(null);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getTokens().access;
    if (!token) return;
    Promise.all([
      apiFetch("/alumno/tutor/progress", { token }).then((d) => setProgress(d)),
      apiFetch("/alumno/tutor/study-plans", { token }).then((d) => setStudyPlans(d as any[])),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 sm:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Progreso</h1>
        <p className="text-slate-500">Estadísticas de tu aprendizaje</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Target className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress?.total_exercises || 0}</p>
              <p className="text-sm text-slate-500">Ejercicios totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress?.completed_exercises || 0}</p>
              <p className="text-sm text-slate-500">Completados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(progress?.accuracy || 0)}%</p>
              <p className="text-sm text-slate-500">Precisión</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center">
              <Brain className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress?.total_chats || 0}</p>
              <p className="text-sm text-slate-500">Chats con tutor</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Planes de estudio</CardTitle></CardHeader>
          <CardContent>
            {studyPlans.length > 0 ? (
              <div className="space-y-3">
                {studyPlans.map((plan: any) => (
                  <div key={plan.id} className="p-4 rounded-lg border hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{plan.title}</h4>
                      <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                        {plan.status === "active" ? "Activo" : "Completado"}
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${plan.progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{Math.round(plan.progress)}% completado</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <BookOpen className="h-10 w-10 text-slate-200 mb-3" />
                <p className="text-slate-500 text-sm mb-3">Sin planes de estudio aún</p>
                <Link href="/alumno/tutor">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">Generar plan con IA</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Rendimiento</CardTitle></CardHeader>
          <CardContent className="flex justify-center py-4">
            <ProgressRing
              value={progress?.accuracy || 0}
              color={progress?.accuracy >= 70 ? "#10b981" : progress?.accuracy >= 50 ? "#f59e0b" : "#ef4444"}
              label="Tasa de acierto"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
