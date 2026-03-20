
"use client";

import { useState } from "react";
import { useProfesorExams } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Plus, FileText, Sparkles, ChevronRight, Zap, CheckCircle, Clock, AlertCircle, Search } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const statusConfig: Record<string, { label: string; icon: any; class: string }> = {
  draft: { label: "Sin referencia", icon: Clock, class: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  processing: { label: "Procesando", icon: Zap, class: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  ready: { label: "Listo para corregir", icon: CheckCircle, class: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
  correcting: { label: "Corrigiendo...", icon: Zap, class: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 animate-pulse" },
  corrected: { label: "Corregido", icon: CheckCircle, class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  published: { label: "Publicado", icon: CheckCircle, class: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" },
  error: { label: "Error", icon: AlertCircle, class: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
};

export default function ExamenesPage() {
  const { data: exams, isLoading } = useProfesorExams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const pending = (exams as any[])?.filter((e) => e.status === "ready" || e.status === "draft").length || 0;
  const corrected = (exams as any[])?.filter((e) => e.status === "corrected" || e.status === "published").length || 0;

  const filteredByStatus = statusFilter === "all"
    ? (exams as any[]) || []
    : (exams as any[])?.filter((e: any) => e.status === statusFilter) || [];
  const filtered = filteredByStatus.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const startItem = filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, filtered.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Exámenes</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {exams?.length ? `${exams.length} exámenes · ${corrected} corregidos · ${pending} pendientes` : "Gestiona tus exámenes y correcciones"}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/profesor/generar" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full sm:w-auto whitespace-nowrap"><Sparkles className="h-4 w-4 mr-2" />Generar con IA</Button>
          </Link>
          <Link href="/profesor/examenes/nuevo" className="flex-1 sm:flex-initial">
            <Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto whitespace-nowrap"><Plus className="h-4 w-4 mr-2" />Nuevo examen</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : exams?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Crea tu primer examen</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">
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
        <>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "Todos" },
              { value: "draft", label: "Sin referencia" },
              { value: "ready", label: "Listos para corregir" },
              { value: "corrected", label: "Corregidos" },
              { value: "published", label: "Publicados" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Buscar exámenes por título..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="space-y-2">
            {paginated.map((exam: any) => {
              const cfg = statusConfig[exam.status] || statusConfig.draft;
              const StatusIcon = cfg.icon;
              return (
                <Link key={exam.id} href={`/profesor/examenes/${exam.id}`}>
                  <Card className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
                    <CardContent className="flex items-center justify-between py-4 px-5">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{exam.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{exam.total_points} pts · {new Date(exam.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={`${cfg.class} gap-1`}>
                          <StatusIcon className="h-3 w-3" />{cfg.label}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
            {filtered.length === 0 && search && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No se encontraron exámenes que coincidan con &quot;{search}&quot;</p>
            )}
          </div>
          {filtered.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Mostrando {startItem}-{endItem} de {filtered.length}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
