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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Target, Brain, BookOpen, Sparkles, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ProgresoPage() {
  const [progress, setProgress] = useState<any>(null);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const loadData = () => {
    const token = getTokens().access;
    if (!token) return;
    Promise.all([
      apiFetch("/alumno/tutor/progress", { token }).then((d) => setProgress(d)),
      apiFetch("/alumno/tutor/study-plans", { token }).then((d) => setStudyPlans(d as any[])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openGenerateDialog = async () => {
    const token = getTokens().access;
    if (!token) return;
    try {
      const secs = await apiFetch<any[]>("/alumno/sections", { token });
      // Deduplicate by subject_id so each subject appears once
      const seen = new Set<string>();
      const unique = secs.filter((s: any) => {
        if (seen.has(s.subject_id)) return false;
        seen.add(s.subject_id);
        return true;
      });
      setSections(unique);
    } catch {
      setSections([]);
    }
    setSelectedSubjectId("");
    setDialogOpen(true);
  };

  const handleGenerate = async () => {
    const token = getTokens().access;
    if (!token) return;
    setGenerating(true);
    try {
      const formData = new FormData();
      if (selectedSubjectId) {
        formData.append("subject_id", selectedSubjectId);
      }
      await apiFetch("/alumno/tutor/study-plans/generate", {
        method: "POST",
        body: formData,
        token,
      });
      setDialogOpen(false);
      // Refresh study plans
      const plans = await apiFetch<any[]>("/alumno/tutor/study-plans", { token });
      setStudyPlans(plans);
    } catch (err: any) {
      toast.error(err.message || "Error al generar el plan");
    } finally {
      setGenerating(false);
    }
  };

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
        <p className="text-slate-500 dark:text-slate-400">Estadísticas de tu aprendizaje</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
              <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress?.total_exercises || 0}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ejercicios totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress?.completed_exercises || 0}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Completados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(progress?.accuracy || 0)}%</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Precisión</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
              <Brain className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress?.total_chats || 0}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Chats con tutor</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actionable insight */}
      {progress && (progress.accuracy > 0 || progress.total_exercises > 0) && (
        <Card className={`border-l-4 ${progress.accuracy >= 70 ? "border-emerald-400" : progress.accuracy >= 50 ? "border-amber-400" : "border-red-400"}`}>
          <CardContent className="pt-6 flex items-start gap-4">
            <Sparkles className={`h-6 w-6 shrink-0 ${progress.accuracy >= 70 ? "text-emerald-500" : progress.accuracy >= 50 ? "text-amber-500" : "text-red-500"}`} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">
                {progress.accuracy >= 70
                  ? "Excelente rendimiento"
                  : progress.accuracy >= 50
                  ? "Buen progreso, puedes mejorar"
                  : "Necesitas practicar más"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {progress.accuracy >= 70
                  ? "Sigue así. Intenta temas más avanzados con el tutor IA."
                  : progress.accuracy >= 50
                  ? "Estás cerca. Pide al tutor IA ejercicios de los temas donde tienes más errores."
                  : "No te preocupes, el tutor IA puede ayudarte paso a paso con los temas difíciles."}
              </p>
              <Link href="/alumno/tutor">
                <Button size="sm" className="mt-3 bg-indigo-600 hover:bg-indigo-700">
                  <Brain className="h-3.5 w-3.5 mr-1.5" />
                  {progress.accuracy >= 70 ? "Explorar temas avanzados" : "Practicar con el tutor"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Planes de estudio</CardTitle>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={openGenerateDialog}>
                <Plus className="h-4 w-4 mr-1" />Generar plan
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {studyPlans.length > 0 ? (
              <div className="space-y-3">
                {studyPlans.map((plan: any) => (
                  <Link key={plan.id} href={`/alumno/tutor?plan=${plan.id}`} className="block">
                    <div className="p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-200 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{plan.title}</h4>
                        <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                          {plan.status === "active" ? "Activo" : "Completado"}
                        </Badge>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{plan.description}</p>
                      )}
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${plan.progress}%` }} />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{Math.round(plan.progress)}% completado</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <BookOpen className="h-10 w-10 text-slate-200 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">Sin planes de estudio aún</p>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={openGenerateDialog}>
                  <Sparkles className="h-4 w-4 mr-2" />Generar plan con IA
                </Button>
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

      {/* Generate study plan dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar plan de estudio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              El tutor IA analizará tus resultados y creará un plan de estudio personalizado.
            </p>
            {sections.length > 0 ? (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Materia (opcional)</label>
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las materias" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s: any) => (
                      <SelectItem key={s.subject_id} value={s.subject_id}>
                        {s.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No estás inscrito en ninguna sección.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={generating}>
              Cancelar
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />Generar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
