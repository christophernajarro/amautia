"use client";

import { useState } from "react";
import { useProfesorExams, useRunPlagiarismCheck, usePlagiarismResults } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, Search, Loader2, AlertTriangle, CheckCircle, FileText, AlertCircle, Bot } from "lucide-react";
import { toast } from "sonner";

function similarityColor(pct: number): string {
  if (pct >= 80) return "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
  if (pct >= 50) return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
  return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800";
}

function similarityBadge(pct: number): { label: string; class: string } {
  if (pct >= 80) return { label: "Alto", class: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300" };
  if (pct >= 50) return { label: "Medio", class: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" };
  return { label: "Bajo", class: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" };
}

export default function PlagioPage() {
  const { data: exams, isLoading: loadingExams } = useProfesorExams();
  const [selectedExamId, setSelectedExamId] = useState("");
  const runCheck = useRunPlagiarismCheck();
  const { data: results, isLoading: loadingResults } = usePlagiarismResults(selectedExamId);

  const correctedExams = (exams as any[] || []).filter((e: any) => e.status === "corrected" || e.status === "published");

  const handleRunCheck = async () => {
    if (!selectedExamId) { toast.error("Selecciona un examen"); return; }
    try {
      await runCheck.mutateAsync({ exam_id: selectedExamId });
      toast.success("Análisis de plagio completado");
    } catch (err: any) {
      toast.error(err.message || "Error al ejecutar el análisis");
    }
  };

  const flaggedCount = results?.filter((r: any) => r.similarity_percentage >= 50).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Detección de Plagio</h1>
        <p className="text-slate-500 dark:text-slate-400">Analiza similitudes entre respuestas de alumnos</p>
      </div>

      {/* Select exam + run */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1.5 block">Seleccionar examen</label>
              {loadingExams ? (
                <Skeleton className="h-10" />
              ) : (
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un examen corregido" /></SelectTrigger>
                  <SelectContent>
                    {correctedExams.map((exam: any) => (
                      <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex items-end">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
                onClick={handleRunCheck}
                disabled={!selectedExamId || runCheck.isPending}
              >
                {runCheck.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analizando...</>
                ) : (
                  <><Search className="h-4 w-4 mr-2" />Ejecutar análisis</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats summary */}
      {selectedExamId && results && results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                <FileText className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{results.length}</p>
                <p className="text-sm text-slate-500">Pares analizados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{flaggedCount}</p>
                <p className="text-sm text-slate-500">Casos sospechosos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{results.length - flaggedCount}</p>
                <p className="text-sm text-slate-500">Sin problemas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results table */}
      {selectedExamId && (
        loadingResults ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : results && results.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Resultados del análisis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno 1</TableHead>
                    <TableHead>Alumno 2</TableHead>
                    <TableHead className="text-center">Similitud</TableHead>
                    <TableHead className="text-center">Riesgo</TableHead>
                    <TableHead className="text-center">IA</TableHead>
                    <TableHead>Segmentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results
                    .sort((a: any, b: any) => (b.similarity_percentage || 0) - (a.similarity_percentage || 0))
                    .map((result: any, idx: number) => {
                      const sim = result.similarity_percentage || 0;
                      const badge = similarityBadge(sim);
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{result.student_1_name || "Alumno A"}</TableCell>
                          <TableCell className="font-medium">{result.student_2_name || "Alumno B"}</TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-sm font-bold border ${similarityColor(sim)}`}>
                              {sim.toFixed(0)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={badge.class}>{badge.label}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {result.ai_detection_score != null ? (
                              <div className="flex items-center justify-center gap-1">
                                <Bot className="h-3.5 w-3.5 text-violet-500" />
                                <span className="text-sm">{result.ai_detection_score}%</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-500">
                              {result.flagged_segments || 0} segmentos
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : results ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <CheckCircle className="h-10 w-10 text-emerald-400 dark:text-emerald-500 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No se encontraron casos de plagio</p>
            </CardContent>
          </Card>
        ) : null
      )}

      {!selectedExamId && (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6">
              <ShieldAlert className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Selecciona un examen</h3>
            <p className="text-sm text-slate-500 max-w-sm text-center">
              Elige un examen corregido para analizar similitudes entre respuestas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
