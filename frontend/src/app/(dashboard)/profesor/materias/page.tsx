"use client";

import { useState } from "react";
import { useProfesorSubjects, useCreateSubject, useDeleteSubject } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Layers, Trash2, BookOpen, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";

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

  const handleCreate = async () => {
    await createSubject.mutateAsync(form);
    setShowCreate(false);
    setForm({ name: "", description: "", color: "#3B82F6" });
  };

  const toggleExpand = async (subjectId: string) => {
    if (expanded === subjectId) {
      setExpanded(null);
      return;
    }
    setExpanded(subjectId);
    if (!sections[subjectId]) {
      const token = getTokens().access;
      const data = await apiFetch<Section[]>(`/profesor/subjects/${subjectId}/sections`, { token: token! });
      setSections((prev) => ({ ...prev, [subjectId]: data }));
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const createSection = async (subjectId: string) => {
    if (!newSection.trim()) return;
    setCreatingSec(true);
    const token = getTokens().access;
    const sec = await apiFetch<Section>(`/profesor/subjects/${subjectId}/sections`, {
      method: "POST", token: token!, body: JSON.stringify({ name: newSection }),
    });
    setSections((prev) => ({ ...prev, [subjectId]: [...(prev[subjectId] || []), sec] }));
    setNewSection("");
    setCreatingSec(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Materias</h1>
          <p className="text-slate-500">
            {subjects?.length ? `${subjects.length} materias · Haz clic para ver secciones y códigos de clase` : "Gestiona tus materias y secciones"}
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Nueva materia</Button>
          </DialogTrigger>
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
                      className={`h-8 w-8 rounded-full border-2 transition-all ${form.color === c ? "border-slate-900 scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createSubject.isPending || !form.name.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {createSubject.isPending ? "Creando..." : "Crear materia"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : subjects?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
              <BookOpen className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Crea tu primera materia</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm text-center">
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
            <Card key={s.id} className="overflow-hidden">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpand(s.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                    <BookOpen className="h-6 w-6" style={{ color: s.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{s.name}</h3>
                    {s.description && <p className="text-sm text-slate-500">{s.description}</p>}
                    <div className="flex gap-4 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{s.sections_count} secciones</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.students_count} alumnos</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); deleteSubject.mutate(s.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {expanded === s.id ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                </div>
              </div>

              {expanded === s.id && (
                <div className="border-t bg-slate-50 p-5">
                  <div className="space-y-3">
                    {(sections[s.id] || []).length === 0 && !creatingSec ? (
                      <p className="text-sm text-slate-500 text-center py-4">No hay secciones. Crea una para generar un código de clase.</p>
                    ) : (
                      (sections[s.id] || []).map((sec) => (
                        <div key={sec.id} className="flex items-center justify-between bg-white rounded-lg p-4 border">
                          <div>
                            <p className="font-medium text-sm text-slate-900">{sec.name}</p>
                            <p className="text-xs text-slate-500">{sec.students_count} alumnos</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold tracking-wider">
                              {sec.class_code}
                            </code>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => copyCode(sec.class_code)}
                              className="text-slate-400 hover:text-indigo-600"
                            >
                              {copiedCode === sec.class_code ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
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
                        className="bg-white"
                      />
                      <Button onClick={() => createSection(s.id)} disabled={creatingSec || !newSection.trim()} size="sm" className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
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
