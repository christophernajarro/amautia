
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
import { Plus, Users, Layers, Trash2, BookOpen } from "lucide-react";

const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#6366F1", "#14B8A6"];

export default function MateriasPage() {
  const { data: subjects, isLoading } = useProfesorSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#3B82F6" });

  const handleCreate = async () => {
    await createSubject.mutateAsync(form);
    setShowCreate(false);
    setForm({ name: "", description: "", color: "#3B82F6" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Materias</h1>
          <p className="text-slate-500">Gestiona tus materias y secciones</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger>
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
              <Button onClick={handleCreate} disabled={createSubject.isPending || !form.name} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {createSubject.isPending ? "Creando..." : "Crear materia"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : subjects?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">Sin materias</h3>
            <p className="text-sm text-slate-500 mb-4">Crea tu primera materia para empezar</p>
            <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />Crear materia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects?.map((s: any) => (
            <Card key={s.id} className="group hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "20" }}>
                      <BookOpen className="h-5 w-5" style={{ color: s.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      {s.description && <p className="text-sm text-slate-500 mt-0.5">{s.description}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-red-500"
                    onClick={() => deleteSubject.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1"><Layers className="h-4 w-4" />{s.sections_count} secciones</div>
                  <div className="flex items-center gap-1"><Users className="h-4 w-4" />{s.students_count} alumnos</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
