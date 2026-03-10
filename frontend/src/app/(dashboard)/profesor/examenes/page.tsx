
"use client";

import { useProfesorExams } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Plus, FileText, Sparkles, ChevronRight, Zap, CheckCircle, Clock, AlertCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: any; class: string }> = {
  draft: { label: "Borrador", icon: Clock, class: "bg-slate-100 text-slate-700" },
  processing: { label: "Procesando", icon: Zap, class: "bg-blue-100 text-blue-700" },
  ready: { label: "Listo", icon: CheckCircle, class: "bg-green-100 text-green-700" },
  correcting: { label: "Corrigiendo...", icon: Zap, class: "bg-yellow-100 text-yellow-700 animate-pulse" },
  corrected: { label: "Corregido", icon: CheckCircle, class: "bg-emerald-100 text-emerald-700" },
  published: { label: "Publicado", icon: CheckCircle, class: "bg-indigo-100 text-indigo-700" },
  error: { label: "Error", icon: AlertCircle, class: "bg-red-100 text-red-700" },
};

export default function ExamenesPage() {
  const { data: exams, isLoading } = useProfesorExams();

  const pending = (exams as any[])?.filter((e) => e.status === "ready" || e.status === "draft").length || 0;
  const corrected = (exams as any[])?.filter((e) => e.status === "corrected" || e.status === "published").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exámenes</h1>
          <p className="text-slate-500">
            {exams?.length ? `${exams.length} exámenes · ${corrected} corregidos · ${pending} pendientes` : "Gestiona tus exámenes y correcciones"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/profesor/generar">
            <Button variant="outline"><Sparkles className="h-4 w-4 mr-2" />Generar con IA</Button>
          </Link>
          <Link href="/profesor/examenes/nuevo">
            <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Nuevo examen</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : exams?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Crea tu primer examen</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm text-center">
              Sube las preguntas, tus alumnos responden, y la IA corrige todo automáticamente
            </p>
            <div className="flex gap-3">
              <Link href="/profesor/examenes/nuevo">
                <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Crear manual</Button>
              </Link>
              <Link href="/profesor/generar">
                <Button variant="outline"><Sparkles className="h-4 w-4 mr-2" />Generar con IA</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {exams?.map((exam: any) => {
            const cfg = statusConfig[exam.status] || statusConfig.draft;
            const StatusIcon = cfg.icon;
            return (
              <Link key={exam.id} href={`/profesor/examenes/${exam.id}`}>
                <Card className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{exam.title}</p>
                        <p className="text-sm text-slate-500">{exam.total_points} pts · {new Date(exam.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={`${cfg.class} gap-1`}>
                        <StatusIcon className="h-3 w-3" />{cfg.label}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
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
