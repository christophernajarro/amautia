"use client";

import { useParams } from "next/navigation";
import { useChildProgress } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, BookOpen, FileText, TrendingUp, Calendar, Activity, AlertCircle } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ChildDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  const { data: progress, isLoading } = useChildProgress(studentId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/padre"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-2xl font-bold">Detalle del alumno</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No se pudo cargar la informacion del alumno</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trendData = progress.score_trend?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("es-PE", { day: "numeric", month: "short" }),
    score: item.score,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/padre">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {progress.first_name?.[0]}{progress.last_name?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{progress.first_name} {progress.last_name}</h1>
            <p className="text-slate-500 dark:text-slate-400">{progress.email || ""}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress.average_score?.toFixed(1) || "-"}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Promedio general</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress.total_exams || 0}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Examenes rendidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress.subjects?.length || 0}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Materias</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
              <Activity className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress.activity_days || 0}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Dias activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progress chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tendencia de notas</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trendData} margin={{ top: 5, right: 20, bottom: 20, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 20]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-400 py-12">Sin datos de tendencia aun</p>
            )}
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Materias y calificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {progress.subjects && progress.subjects.length > 0 ? (
              <div className="space-y-3">
                {progress.subjects.map((subj: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{subj.name}</p>
                        <p className="text-xs text-slate-400">{subj.section_name || ""}</p>
                      </div>
                    </div>
                    <Badge className={
                      (subj.average || 0) >= 14 ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" :
                      (subj.average || 0) >= 11 ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" :
                      "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                    }>
                      {subj.average?.toFixed(1) || "-"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">Sin materias registradas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent exams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Examenes recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {progress.recent_exams && progress.recent_exams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Examen</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead className="text-center">Nota</TableHead>
                  <TableHead className="text-center">Porcentaje</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.recent_exams.map((exam: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{exam.title || exam.exam_title}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{exam.subject_name || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        (exam.score || 0) >= 14 ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" :
                        (exam.score || 0) >= 11 ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" :
                        "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                      }>
                        {exam.score ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{exam.percentage != null ? `${exam.percentage}%` : "-"}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 text-sm">
                      {exam.date ? new Date(exam.date).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-slate-400 py-8">Sin examenes recientes</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
