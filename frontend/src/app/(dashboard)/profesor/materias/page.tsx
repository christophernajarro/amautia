"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useProfesorSubjects, useCreateSubject, useDeleteSubject } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Layers, Trash2, BookOpen, Copy, Check, ChevronDown, ChevronRight, AlertCircle, MessageCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { toast } from "sonner";

const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#6366F1", "#14B8A6"];

interface Section {
  id: string;
  name: string;
  class_code: string;
  students_count: number;
  is_active: boolean;
}

export default function MateriasPage() {
  const { data: subjects, isLoading } = useProfesorSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#3B82F6" });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newSection, setNewSection] = useState("");
  const [creatingSec, setCreatingSec] = useState(false);
  const creatingSectionRef = useRef(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Clear section input when switching between expanded subjects
  useEffect(() => { setNewSection(""); }, [expanded]);

  const handleCreate = async () => {
    try {
      const newSubject = await createSubject.mutateAsync(form) as any;
      setShowCreate(false);
      setForm({ name: "", description: "", color: "#3B82F6" });
      // Auto-expand the newly created subject
      if (newSubject?.id) {
        setExpanded(newSubject.id);
        setSections((prev) => ({ ...prev, [newSubject.id]: [] }));
      }
      toast.success("Materia creada correctamente");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al crear materia");
    }
  };

  const toggleExpand = async (subjectId: string) => {
    if (expanded === subjectId) {
      setExpanded(null);
      return;
    }
    setExpanded(subjectId);
    if (!sections[subjectId]) {
      try {
        const token = getTokens().access;
        const data = await apiFetch<Section[]>(`/profesor/subjects/${subjectId}/sections`, { token: token! });
        setSections((prev) => ({ ...prev, [subjectId]: data }));
      } catch (err: any) {
        setErrorMsg(err.message || "Error al cargar secciones");
      }
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const createSection = async (subjectId: string) => {
    if (!newSection.trim() || creatingSectionRef.current) return;
    creatingSectionRef.current = true;
    setCreatingSec(true);
    try {
      const token = getTokens().access;
      const sec = await apiFetch<Section>(`/profesor/subjects/${subjectId}/sections`, {
        method: "POST", token: token!, body: JSON.stringify({ name: newSection }),
      });
      setSections((prev) => ({ ...prev, [subjectId]: [...(prev[subjectId] || []), sec] }));
      setNewSection("");
      toast.success("Sección creada correctamente");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al crear sección");
    }
    creatingSectionRef.current = false;
    setCreatingSec(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Materias</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {subjects?.length ? `${subjects.length} materias · Haz clic para ver secciones y códigos de clase` : "Gestiona tus materias y secciones"}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Nueva materia</Button>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear materia</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nombre de la materia" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Textarea placeholder="Descripción (opcional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${form.color === c ? "border-slate-900 dark:border-slate-100 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createSubject.isPending || !form.name.trim()} title={createSubject.isPending ? "Procesando..." : !form.name.trim() ? "Ingresa un nombre para la materia" : undefined} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {createSubject.isPending ? "Creando..." : "Crear materia"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-400">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400">&#x2715;</button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : subjects?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-6">
              <BookOpen className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Crea tu primera materia</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">
              Organiza tus clases por materia y sección. Cada sección genera un código único para que tus alumnos se unan.
            </p>
            <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />Crear materia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subjects?.map((s: any) => (
            <Card key={s.id} className="overflow-hidden group">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleExpand(s.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                    <BookOpen className="h-6 w-6" style={{ color: s.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</h3>
                    {s.description && <p className="text-sm text-slate-500">{s.description}</p>}
                    <div className="flex gap-4 mt-1 text-xs text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{s.sections_count} {s.sections_count === 1 ? "sección" : "secciones"}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.students_count} {s.students_count === 1 ? "alumno" : "alumnos"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); if (window.confirm("¿Estás seguro de eliminar esta materia? Se eliminarán todas sus secciones.")) deleteSubject.mutate(s.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {expanded === s.id ? <ChevronDown className="h-5 w-5 text-slate-400 dark:text-slate-500" /> : <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500" />}
                </div>
              </div>

              {expanded === s.id && (
                <div className="border-t bg-slate-50 dark:bg-slate-800/50 p-5">
                  <div className="space-y-3">
                    {(sections[s.id] || []).length === 0 && !creatingSec ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-500">No hay secciones. Crea una para generar un código de clase.</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Los alumnos usan el código de clase para unirse a tu sección desde su panel.</p>
                      </div>
                    ) : (
                      (sections[s.id] || []).map((sec) => (
                        <div key={sec.id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg p-4 border dark:border-slate-700">
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{sec.name}</p>
                            <Link href={`/profesor/alumnos?section=${sec.id}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                              {sec.students_count} {sec.students_count === 1 ? "alumno" : "alumnos"} →
                            </Link>
                          </div>
                          <div className="flex items-center gap-2" title="Los alumnos ingresan este código para unirse a esta sección">
                            <code className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold tracking-wider">
                              {sec.class_code}
                            </code>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => copyCode(sec.class_code)}
                              className="text-slate-400 dark:text-slate-500 hover:text-indigo-600"
                              title="Copiar codigo"
                            >
                              {copiedCode === sec.class_code ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(`Unete a mi clase en Amautia con el codigo: ${sec.class_code}\n\nRegistrate en: https://amautia.com`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                              title="Compartir por WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Add section */}
                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Nombre de nueva sección (ej: 4to A)"
                        value={newSection}
                        onChange={(e) => setNewSection(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && createSection(s.id)}
                        className="bg-white dark:bg-slate-900"
                      />
                      <Button onClick={() => createSection(s.id)} disabled={creatingSec || !newSection.trim()} title={creatingSec ? "Procesando..." : !newSection.trim() ? "Ingresa un nombre para la sección" : undefined} size="sm" className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                        <Plus className="h-4 w-4 mr-1" />{creatingSec ? "..." : "Agregar"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
