
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useProfesorSubjects } from "@/lib/api-hooks";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Upload, Sparkles } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { toast } from "sonner";

export default function NuevoExamenPage() {
  const router = useRouter();
  const { data: subjects, isLoading } = useProfesorSubjects();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", section_id: "", total_points: 20, grading_scale: "0-20",
  });
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select materia if only one exists
  useEffect(() => {
    if (subjects?.length === 1 && !selectedSubjectId) {
      const subjectId = (subjects[0] as any).id;
      setSelectedSubjectId(subjectId);
      loadSections(subjectId);
    }
  }, [subjects]);

  const loadSections = async (subjectId: string) => {
    try {
      const token = getTokens().access;
      const data = await apiFetch<any[]>(`/profesor/subjects/${subjectId}/sections`, { token: token! });
      setSections(data);
      // Auto-select section if only one exists
      if (data.length === 1) {
        setForm((prev) => ({ ...prev, section_id: data[0].id }));
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Error al cargar secciones");
      setSections([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.section_id || !file) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const token = getTokens().access;
      // Step 1: Create the exam
      const result = await apiFetch<any>("/profesor/exams", {
        method: "POST", token: token!, body: JSON.stringify(form),
      });
      const examId = result.id;

      // Step 2: Upload reference file
      const formData = new FormData();
      formData.append("file", file);
      await apiFetch(`/profesor/exams/${examId}/reference`, {
        method: "POST", token: token!, body: formData,
      });

      // Step 3: Process with AI
      await apiFetch(`/profesor/exams/${examId}/process-reference`, { method: "POST", token: token! });

      toast.success("Examen creado exitosamente");
      router.push(`/profesor/examenes/${examId}`);
    } catch (e: any) {
      setErrorMsg(e.message || "Error al crear examen");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumb items={[
        { label: "Exámenes", href: "/profesor/examenes" },
        { label: "Nuevo examen" },
      ]} />
      <div className="flex items-center gap-3">
        <Link href="/profesor/examenes"><Button variant="ghost" size="sm" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Examen</h1>
          <p className="text-slate-500 dark:text-slate-400">Completa los datos y sube tu examen de referencia</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Crear examen</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titulo del examen *</Label>
            <Input placeholder="Ej: Examen parcial de Matematicas" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div>
            <Label>Materia *</Label>
            {isLoading ? <Skeleton className="h-10" /> : subjects?.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                No tienes materias. <Link href="/profesor/materias" className="text-indigo-600 hover:underline">Crear materia</Link>
              </div>
            ) : (
              <Select value={selectedSubjectId} onValueChange={(v: string) => { setSelectedSubjectId(v); setForm((prev) => ({ ...prev, section_id: "" })); loadSections(v); }}>
                <SelectTrigger><SelectValue placeholder="Selecciona una materia">{subjects?.find((s: any) => s.id === selectedSubjectId)?.name}</SelectValue></SelectTrigger>
                <SelectContent>
                  {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {sections.length > 0 && (
            <div>
              <Label>Seccion *</Label>
              <Select value={form.section_id} onValueChange={(v: string) => setForm({ ...form, section_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona una seccion">{sections.find((s: any) => s.id === form.section_id)?.name ? `${sections.find((s: any) => s.id === form.section_id).name} (${sections.find((s: any) => s.id === form.section_id).class_code})` : undefined}</SelectValue></SelectTrigger>
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
              <Select value={form.grading_scale} onValueChange={(v: string) => setForm({ ...form, grading_scale: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-20">0-20</SelectItem>
                  <SelectItem value="0-100">0-100</SelectItem>
                  <SelectItem value="A-F">A-F</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Examen de referencia (con respuestas) *</Label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Upload className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              {file ? (
                <>
                  <p className="font-medium text-indigo-600 dark:text-indigo-400 mb-1">{file.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Haz clic para cambiar el archivo</p>
                </>
              ) : (
                <>
                  <p className="font-medium mb-1">Sube tu examen resuelto</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">PDF, imagen o Word con las respuestas correctas</p>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {errorMsg && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">{errorMsg}</p>}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-indigo-600">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span>Creando y procesando con IA...</span>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading || !form.title || !form.section_id || !file}
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base">
            {loading ? "Creando examen..." : "Crear examen"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
