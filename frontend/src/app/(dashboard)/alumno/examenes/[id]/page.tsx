"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRing } from "@/components/charts/progress-ring";
import { CheckCircle, XCircle, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function ExamenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getTokens().access;
    if (token && id) {
      apiFetch(`/student-exams/${id}`, { token }).then((d) => {
        setDetail(d);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32" />
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
    </div>
  );

  if (!detail) return (
    <div className="text-center py-12">
      <p className="text-slate-500">Examen no encontrado</p>
      <Link href="/alumno/examenes"><Button variant="link">Volver</Button></Link>
    </div>
  );

  const pct = detail.percentage ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/alumno/examenes">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Resultado del examen</h1>
          <Badge variant={detail.status === "corrected" ? "default" : "secondary"}>
            {detail.status === "corrected" ? "Corregido" : detail.status}
          </Badge>
        </div>
      </div>

      {/* Score card */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} />
        <CardContent className="pt-6">
          <div className="flex items-center gap-8">
            <ProgressRing
              value={pct}
              color={pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444"}
              label="Porcentaje"
            />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Puntaje obtenido</span>
                <strong>{detail.total_score ?? "—"} pts</strong>
              </div>
              {detail.corrected_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Corregido el</span>
                  <span>{new Date(detail.corrected_at).toLocaleDateString("es-PE")}</span>
                </div>
              )}
              {detail.profesor_reviewed && (
                <div className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  Revisado por el profesor
                </div>
              )}
            </div>
          </div>
          {detail.feedback && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600"><strong>Retroalimentación general:</strong> {detail.feedback}</p>
            </div>
          )}
          {detail.profesor_notes && (
            <div className="mt-3 p-3 bg-indigo-50 rounded-lg flex gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-indigo-800"><strong>Nota del profesor:</strong> {detail.profesor_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-question breakdown */}
      {detail.answers?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Detalle por pregunta</h2>
          {detail.answers.map((ans: any, i: number) => (
            <Card key={i} className={`border-l-4 ${ans.correct ? "border-emerald-400" : "border-red-400"}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {ans.correct
                        ? <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      }
                      <span className="font-medium text-sm">
                        {ans.question_number ? `Pregunta ${ans.question_number}` : `Respuesta ${i + 1}`}
                      </span>
                      {ans.question_text && (
                        <span className="text-slate-400 text-xs truncate max-w-xs">{ans.question_text}</span>
                      )}
                    </div>
                    {ans.feedback && (
                      <p className="text-sm text-slate-600 ml-6">{ans.feedback}</p>
                    )}
                    {ans.suggestion && (
                      <p className="text-xs text-indigo-600 ml-6 mt-1">💡 {ans.suggestion}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-lg font-bold ${ans.correct ? "text-emerald-600" : "text-red-600"}`}>
                      {ans.score ?? 0}
                    </span>
                    <span className="text-slate-400 text-sm">/{ans.max_score ?? "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Link href="/alumno/tutor">
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
          <MessageSquare className="h-4 w-4 mr-2" />
          Preguntar al Tutor IA sobre este examen
        </Button>
      </Link>
    </div>
  );
}
