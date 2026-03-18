"use client";

import { useState } from "react";
import { useProfesorExams, useProfesorSubjects, useExamAnalytics, useAtRiskStudents } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, AlertTriangle, TrendingDown, Target, Users, AlertCircle } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export default function AnalíticasPage() {
  const { data: exams } = useProfesorExams();
  const { data: subjects } = useProfesorSubjects();
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const { data: analytics, isLoading: loadingAnalytics } = useExamAnalytics(selectedExamId);
  const { data: atRisk, isLoading: loadingRisk } = useAtRiskStudents(selectedSectionId);

  const correctedExams = (exams as any[] || []).filter((e: any) => e.status === "corrected" || e.status === "published");
  const sections = (subjects as any[] || []).flatMap((s: any) =>
    (s.sections || []).map((sec: any) => ({ id: sec.id, name: `${s.name} - ${sec.name}` }))
  );

  const scatterData = analytics?.questions?.map((q: any, i: number) => ({
    name: `P${i + 1}`,
    difficulty: q.difficulty_index ?? q.correct_rate ?? 0.5,
    discrimination: q.discrimination_index ?? 0,
  })) || [];

  const histogramData = analytics?.score_distribution?.map((d: any) => ({
    range: d.range || d.label,
    count: d.count,
  })) || [];

  const distColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analíticas Avanzadas</h1>
        <p className="text-slate-500 dark:text-slate-400">Análisis psicométrico de exámenes y alumnos en riesgo</p>
      </div>

      {/* Selectors */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Examen para analizar</label>
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger><SelectValue placeholder="Seleccionar examen" /></SelectTrigger>
            <SelectContent>
              {correctedExams.map((exam: any) => (
                <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Sección para alumnos en riesgo</label>
          <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
            <SelectTrigger><SelectValue placeholder="Seleccionar sección" /></SelectTrigger>
            <SelectContent>
              {sections.map((sec: any) => (
                <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedExamId && (
        loadingAnalytics ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        ) : analytics ? (
          <>
            {/* Summary stats */}
            <div className="grid gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                    <Target className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{analytics.average_score?.toFixed(1) || "-"}</p>
                    <p className="text-sm text-slate-500">Promedio</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{analytics.total_students || 0}</p>
                    <p className="text-sm text-slate-500">Alumnos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{analytics.median_score?.toFixed(1) || "-"}</p>
                    <p className="text-sm text-slate-500">Mediana</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{analytics.std_deviation?.toFixed(2) || "-"}</p>
                    <p className="text-sm text-slate-500">Desviación std.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Scatter plot: difficulty vs discrimination */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Dificultad vs Discriminación</CardTitle>
                </CardHeader>
                <CardContent>
                  {scatterData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <ScatterChart margin={{ top: 5, right: 20, bottom: 20, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="difficulty" name="Dificultad" type="number" domain={[0, 1]} label={{ value: "Dificultad", position: "bottom", offset: 0 }} />
                        <YAxis dataKey="discrimination" name="Discriminación" type="number" domain={[-1, 1]} label={{ value: "Discriminación", angle: -90, position: "insideLeft" }} />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value: any) => Number(value).toFixed(3)} />
                        <Scatter data={scatterData} fill="#6366f1" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-slate-400 dark:text-slate-500 py-12">Sin datos suficientes</p>
                  )}
                </CardContent>
              </Card>

              {/* Score distribution histogram */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Distribución de notas</CardTitle>
                </CardHeader>
                <CardContent>
                  {histogramData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={histogramData} margin={{ top: 5, right: 20, bottom: 20, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {histogramData.map((_: any, idx: number) => (
                            <Cell key={idx} fill={distColors[Math.min(idx, distColors.length - 1)]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-slate-400 dark:text-slate-500 py-12">Sin datos de distribución</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Question-by-question table */}
            {analytics.questions && analytics.questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Análisis por pregunta</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Pregunta</TableHead>
                        <TableHead className="text-center">Tasa de acierto</TableHead>
                        <TableHead className="text-center">Dificultad</TableHead>
                        <TableHead className="text-center">Discriminación</TableHead>
                        <TableHead className="text-center">Calidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.questions.map((q: any, idx: number) => {
                        const disc = q.discrimination_index ?? 0;
                        const quality = disc >= 0.3 ? "Buena" : disc >= 0.15 ? "Aceptable" : "Revisar";
                        const qualityClass = disc >= 0.3 ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" : disc >= 0.15 ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{idx + 1}</TableCell>
                            <TableCell className="max-w-xs">
                              <p className="truncate text-sm">{q.text || q.question_text || `Pregunta ${idx + 1}`}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              {q.correct_rate != null ? `${(q.correct_rate * 100).toFixed(0)}%` : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {q.difficulty_index != null ? q.difficulty_index.toFixed(2) : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {disc.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={qualityClass}>{quality}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No se pudieron cargar las analíticas</p>
            </CardContent>
          </Card>
        )
      )}

      {/* At-risk students */}
      {selectedSectionId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alumnos en riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRisk ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : atRisk && atRisk.length > 0 ? (
              <div className="space-y-2">
                {atRisk.map((student: any, idx: number) => {
                  const riskClass = student.risk_level === "high" ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300" : student.risk_level === "medium" ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" : "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300";
                  const riskLabel = student.risk_level === "high" ? "Alto" : student.risk_level === "medium" ? "Medio" : "Bajo";
                  return (
                    <div key={student.student_id || idx} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{student.student_name || "Alumno"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{student.reason || "Rendimiento por debajo del promedio"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {student.average_score != null && (
                          <span className="text-sm font-semibold">{student.average_score.toFixed(1)}</span>
                        )}
                        <Badge className={riskClass}>{riskLabel}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-slate-400 dark:text-slate-500 py-8">No hay alumnos en riesgo en esta sección</p>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedExamId && !selectedSectionId && (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-6">
              <BarChart3 className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Selecciona para comenzar</h3>
            <p className="text-sm text-slate-500 max-w-sm text-center">
              Elige un examen para ver analíticas psicométricas o una sección para ver alumnos en riesgo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
