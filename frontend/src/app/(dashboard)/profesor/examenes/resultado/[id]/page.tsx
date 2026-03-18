"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRing } from "@/components/charts/progress-ring";
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, Save, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function ResultadoAlumnoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("exam");
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [adjusted, setAdjusted] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [siblings, setSiblings] = useState<any[]>([]);

  useEffect(() => {
    const token = getTokens().access;
    if (token && id) {
      apiFetch(`/profesor/student-exams/${id}`, { token }).then((d: any) => {
        setDetail(d);
        setNotes(d.profesor_notes || "");
        setAdjusted(d.adjusted_score != null ? String(d.adjusted_score) : "");
        setLoading(false);
      }).catch((e: any) => {
        setErrorMsg(e.message || "Error al cargar");
        setLoading(false);
      });
    }
    // Load sibling student exams for prev/next navigation
    if (token && examId) {
      apiFetch<any>(`/profesor/exams/${examId}/results`, { token }).then((r) => {
        setSiblings(r.results || []);
      }).catch(() => {});
    }
  }, [id, examId]);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      const token = getTokens().access;
      const formData = new FormData();
      formData.append("notes", notes);
      if (adjusted) formData.append("adjusted_score", adjusted);
      await apiFetch(`/profesor/student-exams/${id}/review`, {
        method: "PUT", token: token!, body: formData,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || "Error al guardar");
    }
    setSaving(false);
  };

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (!detail) return <p className="text-slate-500 dark:text-slate-400">No encontrado</p>;

  const pct = detail.percentage ?? 0;
  const currentIdx = siblings.findIndex((s: any) => s.id === id);
  const prevSibling = currentIdx > 0 ? siblings[currentIdx - 1] : null;
  const nextSibling = currentIdx >= 0 && currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumb items={[
        { label: "Exámenes", href: "/profesor/examenes" },
        ...(examId ? [{ label: "Examen", href: `/profesor/examenes/${examId}` }] : []),
        { label: detail.student_name || "Resultado" },
      ]} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => examId ? router.push(`/profesor/examenes/${examId}`) : router.back()} aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{detail.student_name || "Detalle de corrección"}</h1>
            {siblings.length > 0 && <p className="text-sm text-slate-500">{currentIdx + 1} de {siblings.length} alumnos</p>}
          </div>
        </div>
        {siblings.length > 1 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!prevSibling}
              onClick={() => prevSibling && router.push(`/profesor/examenes/resultado/${prevSibling.id}?exam=${examId}`)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={!nextSibling}
              onClick={() => nextSibling && router.push(`/profesor/examenes/resultado/${nextSibling.id}?exam=${examId}`)}>
              Siguiente<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
          <button onClick={() => setErrorMsg("")} className="ml-auto text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400">&#x2715;</button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6 flex items-center gap-8">
          <ProgressRing value={pct} color={pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444"} label="Nota" />
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Puntaje</span>
              {detail.adjusted_score != null && detail.adjusted_score !== detail.total_score ? (
                <span className="flex items-center gap-2">
                  <span className="line-through text-slate-400 dark:text-slate-500">{detail.total_score ?? "—"}</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">{detail.adjusted_score} pts</strong>
                </span>
              ) : (
                <strong>{detail.total_score ?? "—"} pts</strong>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Estado IA</span>
              <Badge>{detail.status}</Badge>
            </div>
            {detail.profesor_reviewed && (
              <div className="flex items-center gap-1 text-emerald-600">
                <CheckCircle className="h-4 w-4" />Revisado por profesor
              </div>
            )}
          </div>
        </CardContent>
        {detail.feedback && (
          <CardContent className="pt-0">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-600 dark:text-slate-300">
              <strong>Retroalimentación IA:</strong> {detail.feedback}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Answers */}
      <div className="space-y-3">
        {(detail.answers || []).map((ans: any, i: number) => (
          <Card key={i} className={`border-l-4 ${ans.correct ? "border-emerald-400" : "border-red-400"}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {ans.correct ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="font-medium text-sm">
                      {ans.question_number ? `P${ans.question_number}` : `Respuesta ${i + 1}`}
                    </span>
                    {ans.question_text && <span className="text-slate-400 dark:text-slate-500 text-xs truncate">{ans.question_text}</span>}
                  </div>
                  {ans.student_answer && (
                    <p className="text-xs text-slate-500 ml-6">Respuesta: {ans.student_answer}</p>
                  )}
                  {ans.feedback && <p className="text-sm text-slate-600 dark:text-slate-300 ml-6 mt-1">{ans.feedback}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${ans.correct ? "text-emerald-600" : "text-red-600"}`}>{ans.score ?? 0}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-sm">/{ans.max_score}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profesor review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Revisión del profesor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Puntaje ajustado (opcional)</Label>
            <Input type="number" placeholder="Si difiere del puntaje IA" value={adjusted}
              onChange={(e) => setAdjusted(e.target.value)} className="mt-1 max-w-xs"
              min={0} max={detail.total_points ?? undefined} />
          </div>
          <div>
            <Label>Notas para el alumno</Label>
            <Textarea placeholder="Comentarios adicionales..." value={notes}
              onChange={(e) => setNotes(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saved ? <><CheckCircle className="h-4 w-4 mr-2" />Guardado</> : saving ? "Guardando..." : <><Save className="h-4 w-4 mr-2" />Guardar revisión</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
