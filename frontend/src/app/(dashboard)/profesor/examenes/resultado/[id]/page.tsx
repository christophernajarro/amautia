"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { CheckCircle, XCircle, ArrowLeft, Save, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ResultadoAlumnoPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [adjusted, setAdjusted] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = getTokens().access;
    if (token && id) {
      apiFetch(`/student-exams/${id}`, { token }).then((d: any) => {
        setDetail(d);
        setNotes(d.profesor_notes || "");
        setAdjusted(d.adjusted_score != null ? String(d.adjusted_score) : "");
        setLoading(false);
      });
    }
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const token = getTokens().access;
    const formData = new FormData();
    formData.append("notes", notes);
    if (adjusted) formData.append("adjusted_score", adjusted);
    await fetch(`http://localhost:8000/api/v1/student-exams/${id}/review`, {
      method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formData,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (!detail) return <p className="text-slate-500">No encontrado</p>;

  const pct = detail.percentage ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => history.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">Detalle de corrección</h1>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-center gap-8">
          <ProgressRing value={pct} color={pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444"} label="Nota" />
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Puntaje</span>
              <strong>{detail.total_score ?? "—"} pts</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estado IA</span>
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
            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
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
                    {ans.question_text && <span className="text-slate-400 text-xs truncate">{ans.question_text}</span>}
                  </div>
                  {ans.student_answer && (
                    <p className="text-xs text-slate-500 ml-6">Respuesta: {ans.student_answer}</p>
                  )}
                  {ans.feedback && <p className="text-sm text-slate-600 ml-6 mt-1">{ans.feedback}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${ans.correct ? "text-emerald-600" : "text-red-600"}`}>{ans.score ?? 0}</span>
                  <span className="text-slate-400 text-sm">/{ans.max_score}</span>
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
              onChange={(e) => setAdjusted(e.target.value)} className="mt-1 max-w-xs" />
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
