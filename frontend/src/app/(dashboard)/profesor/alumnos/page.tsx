
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
import { Users, Plus, Copy } from "lucide-react";

export default function AlumnosPage() {
  const { data: subjects } = useProfesorSubjects();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "" });

  useEffect(() => {
    if (selectedSubject) {
      const token = getTokens().access;
      apiFetch(`/profesor/subjects/${selectedSubject}/sections`, { token: token! }).then((d) => setSections(d as any[]));
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSection) {
      setLoading(true);
      const token = getTokens().access;
      apiFetch(`/profesor/sections/${selectedSection}/students`, { token: token! })
        .then((d) => setStudents(d as any[])).finally(() => setLoading(false));
    }
  }, [selectedSection]);

  const addStudent = async () => {
    const token = getTokens().access;
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    await fetch(`http://localhost:8000/api/v1/profesor/sections/${selectedSection}/students`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
    });
    setShowAdd(false);
    const updated = await apiFetch(`/profesor/sections/${selectedSection}/students`, { token: token! });
    setStudents(updated as any[]);
  };

  const classCode = sections.find(s => s.id === selectedSection)?.class_code;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alumnos</h1>
          <p className="text-slate-500">Gestiona los alumnos de tus secciones</p>
        </div>
        {selectedSection && (
          <Button onClick={() => setShowAdd(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />Agregar alumno
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Materia" /></SelectTrigger>
          <SelectContent>
            {subjects?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {sections.length > 0 && (
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Sección" /></SelectTrigger>
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
            <Users className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500">Selecciona una materia y sección para ver los alumnos</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : (
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
                {students.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.first_name} {s.last_name}</TableCell>
                    <TableCell className="text-slate-500">{s.email}</TableCell>
                    <TableCell>{s.phone || "—"}</TableCell>
                    <TableCell className="text-sm text-slate-400">{new Date(s.joined_at).toLocaleDateString("es-PE")}</TableCell>
                  </TableRow>
                ))}
                {students.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-8">Sin alumnos en esta sección</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar alumno</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nombre" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            <Input placeholder="Apellido" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Button onClick={addStudent} className="w-full bg-indigo-600 hover:bg-indigo-700">Agregar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
