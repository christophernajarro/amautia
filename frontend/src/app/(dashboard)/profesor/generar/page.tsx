
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { useProfesorSubjects } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, FileText, CheckCircle, Save, AlertCircle, Pencil } from "lucide-react";

export default function GenerarPage() {
  const router = useRouter();
  const { data: subjects } = useProfesorSubjects();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSectionId, setSaveSectionId] = useState("");
  const [saveSubjectId, setSaveSubjectId] = useState("");
  const [saveSections, setSaveSections] = useState<any[]>([]);
  const [savingExam, setSavingExam] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "", source_text: "", difficulty: "medium", num_questions: 5, education_level: "secundaria",
  });

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = getTokens().access;
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));

      const data = await apiFetch<any>("/profesor/generate", {
        method: "POST", token: token!, body: formData,
      });
      setResult(data);

      // Load detail
      if (data.id) {
        const d = await apiFetch(`/profesor/generated/${data.id}`, { token: token! });
        setDetail(d);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Error al generar examen");
    }
    setLoading(false);
  };

  const loadSectionsForSubject = async (subjectId: string) => {
    const token = getTokens().access;
    const data = await apiFetch<any[]>(`/profesor/subjects/${subjectId}/sections`, { token: token! });
    setSaveSections(data);
    setSaveSectionId("");
  };

  const handleSaveAsExam = async () => {
    if (!result?.id || !saveSectionId) return;
    setSavingExam(true);
    try {
      const token = getTokens().access;
      const formData = new FormData();
      formData.append("section_id", saveSectionId);
      const data = await apiFetch<any>(`/profesor/generated/${result.id}/save-as-exam`, {
        method: "POST", token: token!, body: formData,
      });
      if (data.exam_id) {
        router.push(`/profesor/examenes/${data.exam_id}`);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Error");
    }
    setSavingExam(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generar Examen con IA</h1>
        <p className="text-slate-500 dark:text-slate-400">Crea un examen nuevo a partir de un tema o material</p>
      </div>

      {!result ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Título del examen</Label>
              <Input placeholder="Ej: Examen de Historia del Perú" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Tema o contenido fuente</Label>
              <Textarea placeholder="Describe el tema, pega un texto de referencia, o indica los conceptos que debe cubrir..."
                rows={5} value={form.source_text}
                onChange={(e) => setForm({ ...form, source_text: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Dificultad</Label>
                <Select value={form.difficulty} onValueChange={(v: string) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona">{{ easy: "Fácil", medium: "Medio", hard: "Difícil" }[form.difficulty]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Medio</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preguntas</Label>
                <Input type="number" min={1} max={20} value={form.num_questions}
                  onChange={(e) => setForm({ ...form, num_questions: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Nivel</Label>
                <Select value={form.education_level} onValueChange={(v: string) => setForm({ ...form, education_level: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona">{{ primaria: "Primaria", secundaria: "Secundaria", universidad: "Universidad" }[form.education_level]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primaria">Primaria</SelectItem>
                    <SelectItem value="secundaria">Secundaria</SelectItem>
                    <SelectItem value="universidad">Universidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {errorMsg && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">{errorMsg}</p>}
            <Button onClick={handleGenerate} disabled={loading || !form.source_text}
              className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <><Sparkles className="h-4 w-4 mr-2 animate-pulse" />Generando con IA...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Generar examen</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  {detail?.title || result.title || "Examen generado"}
                </CardTitle>
                <Badge>{result.status}</Badge>
              </div>
            </CardHeader>
          </Card>

          {detail?.questions?.map((q: any, i: number) => (
            <Card key={q.id || i}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {q.number}
                  </div>
                  <div className="flex-1">
                    {editingQuestion === i ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Pregunta</Label>
                          <Textarea value={q.text} rows={2} onChange={(e) => {
                            const updated = [...detail.questions];
                            updated[i] = { ...updated[i], text: e.target.value };
                            setDetail({ ...detail, questions: updated });
                          }} />
                        </div>
                        <div>
                          <Label className="text-xs">Respuesta</Label>
                          <Textarea value={q.answer} rows={2} onChange={(e) => {
                            const updated = [...detail.questions];
                            updated[i] = { ...updated[i], answer: e.target.value };
                            setDetail({ ...detail, questions: updated });
                          }} />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="text-xs">Puntos</Label>
                            <Input type="number" value={q.points} min={1} onChange={(e) => {
                              const updated = [...detail.questions];
                              updated[i] = { ...updated[i], points: Number(e.target.value) };
                              setDetail({ ...detail, questions: updated });
                            }} />
                          </div>
                          <Button variant="outline" size="sm" className="mt-5" onClick={() => setEditingQuestion(null)}>Listo</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <p className="font-medium">{q.text}</p>
                          <Button variant="ghost" size="sm" className="shrink-0 ml-2" onClick={() => setEditingQuestion(i)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <p className="text-sm text-green-700 dark:text-green-400"><strong>Respuesta:</strong> {q.answer}</p>
                          {q.explanation && <p className="text-xs text-green-600 dark:text-green-400 mt-1">{q.explanation}</p>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{q.type}</Badge>
                          <Badge variant="secondary">{q.points} pts</Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setResult(null); setDetail(null); }}>Generar otro</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowSaveDialog(true)}>
              <Save className="h-4 w-4 mr-2" />Guardar como examen
            </Button>
          </div>

          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Guardar como examen</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-slate-500">
                Selecciona la materia y sección donde quieres crear este examen.
                Después podrás subir los exámenes de tus alumnos para corregirlos.
              </p>
              {(!subjects || subjects.length === 0) ? (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Primero crea una materia y sección</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Ve a Materias, crea una materia y agrega al menos una sección para poder guardar exámenes.
                    </p>
                    <Button variant="outline" size="sm" className="mt-3"
                      onClick={() => router.push("/profesor/materias")}>
                      Ir a Materias
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Materia</Label>
                    <Select value={saveSubjectId} onValueChange={(v: string) => { setSaveSubjectId(v); loadSectionsForSubject(v); }}>
                      <SelectTrigger><SelectValue placeholder="Selecciona una materia">{subjects.find((s: any) => s.id === saveSubjectId)?.name}</SelectValue></SelectTrigger>
                      <SelectContent>
                        {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {saveSections.length > 0 && (
                    <div>
                      <Label>Sección</Label>
                      <Select value={saveSectionId} onValueChange={(v: string) => setSaveSectionId(v)}>
                        <SelectTrigger><SelectValue placeholder="Selecciona una sección">{saveSections.find((s: any) => s.id === saveSectionId)?.name ? `${saveSections.find((s: any) => s.id === saveSectionId).name} (${saveSections.find((s: any) => s.id === saveSectionId).class_code})` : undefined}</SelectValue></SelectTrigger>
                        <SelectContent>
                          {saveSections.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.class_code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button onClick={handleSaveAsExam} disabled={!saveSectionId || savingExam}
                    className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {savingExam ? "Guardando..." : "Guardar y continuar"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
