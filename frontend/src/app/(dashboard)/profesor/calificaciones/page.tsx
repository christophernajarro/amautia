"use client";

import { useState } from "react";
import { useProfesorSubjects, useGradingPeriods, useGradebookSummary, useCreateGradebookEntry, useSyncGradebook, useCreateGradingPeriod } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Plus, RefreshCw, Download, Settings, Loader2, AlertCircle, ClipboardList } from "lucide-react";
import { toast } from "sonner";

function gradeColor(score: number, max: number = 20): string {
  const pct = (score / max) * 100;
  if (pct >= 70) return "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
  if (pct >= 50) return "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30";
  return "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30";
}

export default function CalificacionesPage() {
  const { data: subjects, isLoading: loadingSubjects } = useProfesorSubjects();
  const [selectedSection, setSelectedSection] = useState<string>("");
  const { data: periods } = useGradingPeriods(selectedSection);
  const { data: summary, isLoading: loadingSummary } = useGradebookSummary(selectedSection);
  const syncGradebook = useSyncGradebook(selectedSection);
  const createEntry = useCreateGradebookEntry();
  const createPeriod = useCreateGradingPeriod();

  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [entryName, setEntryName] = useState("");
  const [entryMaxScore, setEntryMaxScore] = useState(20);
  const [entryWeight, setEntryWeight] = useState(1);
  const [entryType, setEntryType] = useState("exam");

  const [addPeriodOpen, setAddPeriodOpen] = useState(false);
  const [periodName, setPeriodName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const [activePeriod, setActivePeriod] = useState<string>("all");

  // Build sections from subjects
  const sections = (subjects as any[] || []).flatMap((s: any) =>
    (s.sections || []).map((sec: any) => ({ id: sec.id, name: `${s.name} - ${sec.name}`, subject_name: s.name }))
  );

  const handleSync = async () => {
    try {
      await syncGradebook.mutateAsync();
      toast.success("Calificaciones sincronizadas con exámenes");
    } catch (err: any) {
      toast.error(err.message || "Error al sincronizar");
    }
  };

  const handleAddEntry = async () => {
    if (!entryName.trim()) { toast.error("El nombre es obligatorio"); return; }
    try {
      await createEntry.mutateAsync({
        section_id: selectedSection,
        name: entryName,
        max_score: entryMaxScore,
        weight: entryWeight,
        entry_type: entryType,
      });
      toast.success("Entrada de calificación creada");
      setAddEntryOpen(false);
      setEntryName(""); setEntryMaxScore(20); setEntryWeight(1);
    } catch (err: any) {
      toast.error(err.message || "Error al crear entrada");
    }
  };

  const handleAddPeriod = async () => {
    if (!periodName.trim()) { toast.error("El nombre es obligatorio"); return; }
    try {
      await createPeriod.mutateAsync({
        section_id: selectedSection,
        name: periodName,
        start_date: periodStart || undefined,
        end_date: periodEnd || undefined,
      });
      toast.success("Periodo creado");
      setAddPeriodOpen(false);
      setPeriodName(""); setPeriodStart(""); setPeriodEnd("");
    } catch (err: any) {
      toast.error(err.message || "Error al crear periodo");
    }
  };

  const handleExport = () => {
    toast.info("Exportación de calificaciónes en desarrollo");
  };

  // Get columns from summary entries
  const students = (summary as any[]) || [];
  const entryColumns = students[0]?.entries || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Calificaciones</h1>
          <p className="text-slate-500 dark:text-slate-400">Registro completo de notas por sección</p>
        </div>
        {selectedSection && (
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncGradebook.isPending}>
              {syncGradebook.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sincronizar exámenes
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAddPeriodOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />Nuevo periodo
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setAddEntryOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Agregar nota
            </Button>
          </div>
        )}
      </div>

      {/* Section selector */}
      <Card>
        <CardContent className="pt-6">
          <label className="text-sm font-medium mb-1.5 block">Seleccionar sección</label>
          {loadingSubjects ? (
            <Skeleton className="h-10" />
          ) : (
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger><SelectValue placeholder="Selecciona una sección" /></SelectTrigger>
              <SelectContent>
                {sections.map((sec: any) => (
                  <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {!selectedSection ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <ClipboardList className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecciona una sección</h3>
            <p className="text-sm text-slate-500">Elige una sección para ver y gestionar las calificaciónes</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grading periods tabs */}
          {periods && periods.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={activePeriod === "all" ? "default" : "outline"}
                onClick={() => setActivePeriod("all")}
                className={activePeriod === "all" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
              >
                Todas
              </Button>
              {periods.map((p: any) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant={activePeriod === p.id ? "default" : "outline"}
                  onClick={() => setActivePeriod(p.id)}
                  className={activePeriod === p.id ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          )}

          {/* Gradebook table */}
          {loadingSummary ? (
            <Skeleton className="h-64" />
          ) : students.length > 0 ? (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white dark:bg-slate-950 z-10 min-w-[180px]">Alumno</TableHead>
                      {entryColumns.map((entry: any) => (
                        <TableHead key={entry.id} className="text-center min-w-[80px]">
                          <div className="text-xs">{entry.name}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">/{entry.max_score}</div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center min-w-[100px] font-bold">Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: any) => (
                      <TableRow key={student.student_id}>
                        <TableCell className="sticky left-0 bg-white dark:bg-slate-950 z-10 font-medium">
                          {student.student_name}
                        </TableCell>
                        {(student.entries || []).map((entry: any) => (
                          <TableCell key={entry.id} className="text-center">
                            {entry.score != null ? (
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${gradeColor(entry.score, entry.max_score)}`}>
                                {entry.score}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          {student.weighted_average != null ? (
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-sm font-bold ${gradeColor(student.weighted_average)}`}>
                              {student.weighted_average.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No hay datos de calificaciónes para esta sección</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Sincroniza exámenes o agrega entradas manualmente</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add entry dialog */}
      <Dialog open={addEntryOpen} onOpenChange={setAddEntryOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar entrada de calificación</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nombre</label>
              <Input value={entryName} onChange={(e) => setEntryName(e.target.value)} placeholder="Ej: Examen parcial 1" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo</label>
              <Select value={entryType} onValueChange={setEntryType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">Examen</SelectItem>
                  <SelectItem value="homework">Tarea</SelectItem>
                  <SelectItem value="participation">Participación</SelectItem>
                  <SelectItem value="project">Proyecto</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nota máxima</label>
                <Input type="number" min={1} value={entryMaxScore} onChange={(e) => setEntryMaxScore(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Peso</label>
                <Input type="number" min={0.1} step={0.1} value={entryWeight} onChange={(e) => setEntryWeight(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddEntryOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleAddEntry} disabled={createEntry.isPending}>
              {createEntry.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add period dialog */}
      <Dialog open={addPeriodOpen} onOpenChange={setAddPeriodOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo periodo de calificación</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nombre del periodo</label>
              <Input value={periodName} onChange={(e) => setPeriodName(e.target.value)} placeholder="Ej: Bimestre 1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Fecha inicio</label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Fecha fin</label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPeriodOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleAddPeriod} disabled={createPeriod.isPending}>
              {createPeriod.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Crear periodo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
