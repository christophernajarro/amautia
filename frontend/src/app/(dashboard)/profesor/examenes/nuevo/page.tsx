// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfesorSubjects } from "@/lib/api-hooks";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Upload, FileText, Sparkles } from "lucide-react";
import Link from "next/link";

export default function NuevoExamenPage() {
  const router = useRouter();
  const { data: subjects, isLoading } = useProfesorSubjects();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", section_id: "", total_points: 20, grading_scale: "0-20",
  });
  const [examId, setExamId] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);

  const loadSections = async (subjectId: string) => {
    const token = getTokens().access;
    const data = await apiFetch<any[]>(`/profesor/subjects/${subjectId}/sections`, { token: token! });
    setSections(data);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const token = getTokens().access;
      const result = await apiFetch<any>("/profesor/exams", {
        method: "POST", token: token!, body: JSON.stringify(form),
      });
      setExamId(result.id);
      setStep(2);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleUploadRef = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !examId) return;
    setLoading(true);
    const token = getTokens().access;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    await fetch(`http://localhost:8000/api/v1/profesor/exams/${examId}/reference`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
    });
    // Process with AI
    await apiFetch(`/profesor/exams/${examId}/process-reference`, { method: "POST", token: token! });
    setStep(3);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profesor/examenes"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Examen</h1>
          <p className="text-slate-500">Paso {step} de 3</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? "bg-indigo-600" : "bg-slate-200"}`} />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Información del examen</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título del examen</Label>
              <Input placeholder="Ej: Examen parcial de Matemáticas" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea placeholder="Instrucciones o notas..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Materia</Label>
              {isLoading ? <Skeleton className="h-10" /> : (
                <Select onValueChange={(v) => loadSections(v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona una materia" /></SelectTrigger>
                  <SelectContent>
                    {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            {sections.length > 0 && (
              <div>
                <Label>Sección</Label>
                <Select onValueChange={(v) => setForm({ ...form, section_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona una sección" /></SelectTrigger>
                  <SelectContent>
                    {sections.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.class_code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Puntaje total</Label>
                <Input type="number" value={form.total_points}
                  onChange={(e) => setForm({ ...form, total_points: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Escala</Label>
                <Select value={form.grading_scale} onValueChange={(v) => setForm({ ...form, grading_scale: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-20">0-20</SelectItem>
                    <SelectItem value="0-100">0-100</SelectItem>
                    <SelectItem value="A-F">A-F</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreate} disabled={loading || !form.title || !form.section_id}
              className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? "Creando..." : "Continuar"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Subir examen de referencia</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
              <Upload className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <p className="font-medium mb-1">Sube tu examen resuelto</p>
              <p className="text-sm text-slate-500 mb-4">PDF, imagen o Word con las respuestas correctas</p>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={handleUploadRef}
                className="block mx-auto text-sm" disabled={loading} />
            </div>
            {loading && (
              <div className="flex items-center justify-center gap-2 text-indigo-600">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span>Procesando con IA...</span>
              </div>
            )}
            <Button variant="outline" onClick={() => setStep(3)}>Omitir y agregar preguntas manualmente</Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>¡Examen creado!</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-center">
            <FileText className="h-16 w-16 text-indigo-600 mx-auto" />
            <p className="text-lg font-medium">Tu examen está listo</p>
            <p className="text-slate-500">Ahora puedes subir los exámenes de tus alumnos para corregirlos con IA</p>
            <div className="flex gap-3 justify-center">
              <Link href="/profesor/examenes"><Button variant="outline">Ver exámenes</Button></Link>
              <Button className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => router.push("/profesor/examenes")}>Ir a corregir</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
