"use client";

import { useAlumnoExams } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle, Clock, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  corrected: "Corregido",
  published: "Publicado",
  error: "Error",
};

function getScoreColor(percentage: number | null | undefined) {
  if (percentage == null) return "slate";
  if (percentage >= 70) return "emerald";
  if (percentage >= 50) return "amber";
  return "red";
}

const borderColorMap: Record<string, string> = {
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
  red: "border-l-red-500",
  slate: "border-l-slate-300 dark:border-l-slate-600",
};

const scoreTextColorMap: Record<string, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  slate: "text-slate-400 dark:text-slate-500",
};

const scoreBgMap: Record<string, string> = {
  emerald: "bg-emerald-50 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-800",
  amber: "bg-amber-50 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-800",
  red: "bg-red-50 ring-red-200 dark:bg-red-950/40 dark:ring-red-800",
  slate: "bg-slate-50 ring-slate-200 dark:bg-slate-800/40 dark:ring-slate-700",
};

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function ExamCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-transparent bg-card p-4 ring-1 ring-foreground/10">
      <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  );
}

function ScoreDisplay({ score, percentage }: { score: number | null | undefined; percentage: number | null | undefined }) {
  const color = getScoreColor(percentage);

  if (percentage == null) {
    return (
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ring-2 ${scoreBgMap[color]}`}>
        <Clock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
      </div>
    );
  }

  return (
    <div className={`flex h-12 w-12 flex-col items-center justify-center rounded-full ring-2 ${scoreBgMap[color]}`}>
      <span className={`text-sm font-bold leading-none ${scoreTextColorMap[color]}`}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

export default function AlumnoExamenesPage() {
  const { data: exams, isLoading } = useAlumnoExams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Mis Examenes
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Examenes corregidos y sus resultados
        </p>
      </div>

      {isLoading ? (
        <div className="mx-auto max-w-3xl space-y-5">
          {[...Array(5)].map((_, i) => (
            <ExamCardSkeleton key={i} />
          ))}
        </div>
      ) : exams?.length === 0 ? (
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <BookOpen className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-slate-800 dark:text-slate-200">
                No tienes examenes aun
              </h3>
              <p className="max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
                Cuando tu profesor publique los resultados de un examen, aparecera
                aqui con tu nota y retroalimentacion.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-5">
          {exams?.map((e: any) => {
            const color = getScoreColor(e.percentage);
            const isCorrected = e.status === "corrected" || e.status === "published";
            const StatusIcon = isCorrected ? CheckCircle : Clock;

            return (
              <Link key={e.id} href={`/alumno/examenes/${e.id}`}>
                <Card
                  className={`border-l-4 ${borderColorMap[color]} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <CardContent className="flex items-center gap-3 py-3">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      {isCorrected ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>

                    {/* Title + subject + meta */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {e.exam_title}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {e.subject_name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge
                          variant={isCorrected ? "default" : "secondary"}
                          className="gap-1"
                        >
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_LABELS[e.status] || e.status}
                        </Badge>
                        {e.corrected_at && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {formatDate(e.corrected_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score circle */}
                    <ScoreDisplay score={e.total_score} percentage={e.percentage} />

                    {/* Chevron */}
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
