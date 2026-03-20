"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiFetch, API_URL } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRing } from "@/components/charts/progress-ring";
import {
  CheckCircle, XCircle, ArrowLeft, MessageSquare, FileText,
  Download, Eye, Lightbulb, Award, AlertTriangle
} from "lucide-react";
import Link from "next/link";

const baseUrl = () => API_URL.replace("/api/v1", "");

function FilePreviewLink({ url }: { url: string }) {
  const fullUrl = `${baseUrl()}${url}`;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPdf = /\.pdf$/i.test(url);
  const fileName = url.split("/").pop() || "archivo";

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Tu examen subido</p>
            <p className="text-xs text-muted-foreground truncate">{fileName}</p>
          </div>
          <div className="flex gap-2">
            {(isImage || isPdf) && (
              <a href={fullUrl} target="_blank" rel="noopener">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" /> Ver
                </Button>
              </a>
            )}
            <a href={fullUrl} target="_blank" rel="noopener" download>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" /> Descargar
              </Button>
            </a>
          </div>
        </div>
        {isImage && (
          <img src={fullUrl} alt="Tu examen" className="mt-3 rounded-lg border max-h-64 object-contain" />
        )}
        {isPdf && (
          <iframe src={fullUrl} className="mt-3 w-full rounded-lg border bg-white" style={{ minHeight: 300 }} title="Tu examen" />
        )}
      </CardContent>
    </Card>
  );
}

export default function ExamenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = getTokens().access;
    if (token && id) {
      apiFetch<any>(`/alumno/exams/${id}/resultado`, { token }).then((d) => {
        setDetail({
          ...d,
          feedback: d.general_feedback,
          status: "corrected",
          answers: (d.answers || []).map((a: any) => ({
            ...a,
            correct: a.is_correct,
          })),
        });
        setLoading(false);
      }).catch((e: any) => {
        setErrorMsg(e.message || "No se pudo cargar el resultado");
        setLoading(false);
      });
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
      <p className="text-slate-500 dark:text-slate-400">
        {errorMsg || "Examen no encontrado"}
      </p>
      <Link href="/alumno/examenes"><Button variant="link">Volver</Button></Link>
    </div>
  );

  const pct = detail.percentage ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/alumno/examenes">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{detail.exam_title || "Resultado del examen"}</h1>
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
                <span className="text-slate-500 dark:text-slate-400">Puntaje obtenido</span>
                <strong>{detail.total_score ?? "—"} / {detail.total_points ?? "—"} pts</strong>
              </div>
              {detail.corrected_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Corregido el</span>
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

          {/* Feedback */}
          {detail.feedback && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Retroalimentación general:</strong> {detail.feedback}
              </p>
            </div>
          )}

          {/* Strengths & Areas to improve */}
          {detail.strengths && (
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex gap-2">
              <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                <strong>Fortalezas:</strong> {detail.strengths}
              </p>
            </div>
          )}
          {detail.areas_to_improve && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Para mejorar:</strong> {detail.areas_to_improve}
              </p>
            </div>
          )}

          {/* Professor notes */}
          {detail.profesor_notes && (
            <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-indigo-800 dark:text-indigo-300">
                <strong>Nota del profesor:</strong> {detail.profesor_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Original file preview */}
      {detail.file_url && (
        <FilePreviewLink url={detail.file_url} />
      )}

      {/* Per-question breakdown */}
      {detail.answers?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Detalle por pregunta</h2>
          {detail.answers.map((ans: any, i: number) => (
            <Card key={i} className={`border-l-4 ${ans.correct ? "border-emerald-400" : "border-red-400"}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Question header */}
                    <div className="flex items-center gap-2">
                      {ans.correct
                        ? <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      }
                      <span className="font-medium text-sm">
                        {ans.question_number ? `Pregunta ${ans.question_number}` : `Respuesta ${i + 1}`}
                      </span>
                    </div>

                    {/* Question text */}
                    {ans.question_text && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 ml-6 font-medium">
                        {ans.question_text}
                      </p>
                    )}

                    {/* Student's answer */}
                    {ans.student_answer && (
                      <div className="ml-6 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Tu respuesta:</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{ans.student_answer}</p>
                      </div>
                    )}

                    {/* AI feedback */}
                    {ans.feedback && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 ml-6">
                        {ans.feedback}
                      </p>
                    )}

                    {/* Suggestion for improvement */}
                    {ans.suggestion && (
                      <div className="ml-6 flex items-start gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
                        <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{ans.suggestion}</span>
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <span className={`text-lg font-bold ${ans.correct ? "text-emerald-600" : "text-red-600 dark:text-red-400"}`}>
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
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          <MessageSquare className="h-4 w-4 mr-2" />
          Preguntar al Tutor IA sobre este examen
        </Button>
      </Link>
    </div>
  );
}
