"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useProfesorSubjects, useCreateSubject, useDeleteSubject } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Layers, Trash2, BookOpen, Copy, Check, ChevronDown, AlertCircle, MessageCircle } from "lucide-react";
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
    toast.success("Codigo copiado al portapapeles");
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
      toast.success("Seccion creada correctamente");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al crear seccion");
    }
    creatingSectionRef.current = false;
    setCreatingSec(false);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Materias</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {subjects?.length ? `${subjects.length} materias · Haz clic para ver secciones y codigos de clase` : "Gestiona tus materias y secciones"}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Nueva materia</Button>

        {/* Create subject dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear materia</DialogTitle></DialogHeader>
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                <Input placeholder="Ej: Matematicas, Historia..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descripcion <span className="text-slate-400 font-normal">(opcional)</span></label>
                <Textarea placeholder="Breve descripcion de la materia" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Color de la materia</label>
                <div className="flex gap-2.5">
                  {colors.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      className={`h-9 w-9 rounded-full border-2 transition-all hover:scale-110 ${form.color === c ? "border-slate-900 dark:border-slate-100 scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950" : "border-transparent"}`}
                      style={{ backgroundColor: c, ...(form.color === c ? { ringColor: c } : {}) }} />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createSubject.isPending || !form.name.trim()} title={createSubject.isPending ? "Procesando..." : !form.name.trim() ? "Ingresa un nombre para la materia" : undefined} className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2">
                {createSubject.isPending ? "Creando..." : "Crear materia"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-400">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400">&#x2715;</button>
        </div>
      )}

      {/* Subject list */}
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
              Organiza tus clases por materia y seccion. Cada seccion genera un codigo unico para que tus alumnos se unan.
            </p>
            <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />Crear materia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subjects?.map((s: any) => (
            <Card key={s.id} className="overflow-hidden group" style={{ borderLeft: `4px solid ${s.color}` }}>
              {/* Subject header row */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                onClick={() => toggleExpand(s.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: s.color + "20" }}
                  >
                    <BookOpen className="h-7 w-7" style={{ color: s.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">{s.name}</h3>
                    {s.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{s.description}</p>}
                    <div className="flex gap-4 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        {s.sections_count} {s.sections_count === 1 ? "seccion" : "secciones"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {s.students_count} {s.students_count === 1 ? "alumno" : "alumnos"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); if (window.confirm("Estas seguro de eliminar esta materia? Se eliminaran todas sus secciones.")) deleteSubject.mutate(s.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-transform duration-200"
                    style={{ transform: expanded === s.id ? "rotate(0deg)" : "rotate(-90deg)" }}
                  >
                    <ChevronDown className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Expanded sections area */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: expanded === s.id ? "1000px" : "0px",
                  opacity: expanded === s.id ? 1 : 0,
                }}
              >
                <div className="border-t border-slate-200 dark:border-slate-700/50 bg-slate-50/70 dark:bg-slate-800/30 p-5">
                  <div className="space-y-3">
                    {(sections[s.id] || []).length === 0 && !creatingSec ? (
                      <div className="text-center py-6">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                          <Layers className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No hay secciones aun</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">Crea una seccion para generar un codigo de clase. Los alumnos lo usan para unirse desde su panel.</p>
                      </div>
                    ) : (
                      (sections[s.id] || []).map((sec) => (
                        <div
                          key={sec.id}
                          className="bg-white dark:bg-slate-900/70 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between gap-4">
                            {/* Section info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2.5">
                                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{sec.name}</p>
                                <Link
                                  href={`/profesor/alumnos?section=${sec.id}`}
                                  className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                >
                                  <Users className="h-3 w-3" />
                                  {sec.students_count} {sec.students_count === 1 ? "alumno" : "alumnos"}
                                </Link>
                              </div>
                            </div>

                            {/* Class code + actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Class code pill */}
                              <button
                                onClick={() => copyCode(sec.class_code)}
                                className="group/code inline-flex items-center gap-2 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 cursor-pointer"
                                title="Haz clic para copiar el codigo"
                              >
                                <code className="font-mono text-sm font-bold tracking-widest text-indigo-700 dark:text-indigo-300">
                                  {sec.class_code}
                                </code>
                                {copiedCode === sec.class_code ? (
                                  <Check className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-indigo-400 group-hover/code:text-indigo-600 dark:group-hover/code:text-indigo-300 transition-colors" />
                                )}
                              </button>

                              {/* WhatsApp share */}
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Unete a mi clase en Amautia con el codigo: ${sec.class_code}\n\nRegistrate en: https://amautia.com`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors border border-transparent hover:border-green-200 dark:hover:border-green-800/60"
                                title="Compartir por WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Add section form */}
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="Nombre de nueva seccion (ej: 4to A)"
                        value={newSection}
                        onChange={(e) => setNewSection(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && createSection(s.id)}
                        className="bg-white dark:bg-slate-900/70"
                      />
                      <Button onClick={() => createSection(s.id)} disabled={creatingSec || !newSection.trim()} title={creatingSec ? "Procesando..." : !newSection.trim() ? "Ingresa un nombre para la seccion" : undefined} size="sm" className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                        <Plus className="h-4 w-4 mr-1" />{creatingSec ? "..." : "Agregar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
