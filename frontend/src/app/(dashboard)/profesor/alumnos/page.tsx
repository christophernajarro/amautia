
"use client";

import { useState, useEffect } from "react";
import { useProfesorSubjects } from "@/lib/api-hooks";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, Copy, AlertCircle, Search, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

export default function AlumnosPage() {
  const { data: subjects } = useProfesorSubjects();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = students.filter((s: any) =>
    `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const startItem = filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, filtered.length);

  useEffect(() => {
    if (selectedSubject) {
      const token = getTokens().access;
      apiFetch(`/profesor/subjects/${selectedSubject}/sections`, { token: token! })
        .then((d) => setSections(d as any[]))
        .catch((err: any) => setErrorMsg(err.message || "Error al cargar secciones"));
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSection) {
      setLoading(true);
      const token = getTokens().access;
      apiFetch(`/profesor/sections/${selectedSection}/students`, { token: token! })
        .then((d) => setStudents(d as any[]))
        .catch((err: any) => setErrorMsg(err.message || "Error al cargar alumnos"))
        .finally(() => setLoading(false));
    }
  }, [selectedSection]);

  const addStudent = async () => {
    setSubmitting(true);
    try {
      const token = getTokens().access;
      await apiFetch(`/profesor/sections/${selectedSection}/students`, {
        method: "POST", token: token!, body: JSON.stringify(form),
      });
      setShowAdd(false);
      setForm({ email: "", first_name: "", last_name: "" });
      const updated = await apiFetch(`/profesor/sections/${selectedSection}/students`, { token: token! });
      setStudents(updated as any[]);
      toast.success("Alumno agregado correctamente");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al agregar alumno");
    } finally {
      setSubmitting(false);
    }
  };

  const classCode = sections.find(s => s.id === selectedSection)?.class_code;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alumnos</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestiona los alumnos de tus secciones</p>
        </div>
        {selectedSection && (
          <Button onClick={() => setShowAdd(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />Agregar alumno
          </Button>
        )}
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

      <div className="flex gap-4">
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Materia">{subjects?.find((s: any) => s.id === selectedSubject)?.name}</SelectValue></SelectTrigger>
          <SelectContent>
            {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {sections.length > 0 && (
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Sección">{sections.find((s: any) => s.id === selectedSection)?.name}</SelectValue></SelectTrigger>
            <SelectContent>
              {sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {classCode && (
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(classCode)}>
            <Copy className="h-4 w-4 mr-2" />Código: {classCode}
          </Button>
        )}
      </div>

      {!selectedSection ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            {!subjects || subjects.length === 0 ? (
              <>
                <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Primero crea una materia</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">
                  Para gestionar alumnos necesitas al menos una materia con una sección creada.
                </p>
                <Link href="/profesor/materias">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    Ir a Materias <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Selecciona una materia y sección para ver los alumnos</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 px-4 border-b last:border-b-0">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-3 w-[200px]" />
                  </div>
                  <Skeleton className="h-3 w-[100px]" />
                  <Skeleton className="h-5 w-[72px] rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {students.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
          )}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Inscrito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((s: any) => (
                    <TableRow key={s.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">{s.email}</TableCell>
                      <TableCell>{s.phone || "—"}</TableCell>
                      <TableCell className="text-sm text-slate-400 dark:text-slate-500">{new Date(s.joined_at).toLocaleDateString("es-PE")}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && !search && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="flex flex-col items-center py-12">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-semibold mb-1">No hay alumnos en esta seccion</h3>
                          <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
                            Importa una lista de alumnos o agregalos manualmente para comenzar a gestionar tu seccion.
                          </p>
                          <Button onClick={() => setShowAdd(true)} className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="h-4 w-4 mr-2" />Importar alumnos
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.length === 0 && search && (
                    <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-8">No se encontraron alumnos que coincidan con &quot;{search}&quot;</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {filtered.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-slate-500">Mostrando {startItem}-{endItem} de {filtered.length}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} title={page <= 1 ? "Ya estás en la primera página" : undefined} onClick={() => setPage(page - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} title={page >= totalPages ? "Ya estás en la última página" : undefined} onClick={() => setPage(page + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar alumno</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nombre" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            <Input placeholder="Apellido" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Button onClick={addStudent} disabled={submitting} title={submitting ? "Procesando..." : undefined} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {submitting ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
