"use client";

import { useState } from "react";
import { usePeerReviewAssignments, useCreatePeerReview, useProfesorExams } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Eye, Loader2, ClipboardCheck, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function EvaluacionParesPage() {
  const { data: assignments, isLoading } = usePeerReviewAssignments();
  const { data: exams } = useProfesorExams();
  const createReview = useCreatePeerReview();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [reviewsPerStudent, setReviewsPerStudent] = useState(2);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [deadline, setDeadline] = useState("");

  const [detailId, setDetailId] = useState<string>("");
  const detailAssignment = assignments?.find((a: any) => a.id === detailId);

  const correctedExams = (exams as any[] || []).filter((e: any) => e.status === "corrected" || e.status === "published");

  const handleCreate = async () => {
    if (!selectedExamId) { toast.error("Selecciona un examen"); return; }
    try {
      await createReview.mutateAsync({
        exam_id: selectedExamId,
        reviews_per_student: reviewsPerStudent,
        is_anonymous: isAnonymous,
        deadline: deadline || undefined,
      });
      toast.success("Evaluación de pares creada");
      setCreateOpen(false);
      setSelectedExamId(""); setReviewsPerStudent(2); setIsAnonymous(true); setDeadline("");
    } catch (err: any) {
      toast.error(err.message || "Error al crear evaluación");
    }
  };

  // Detail view
  if (detailId && detailAssignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setDetailId("")}>
            ← Volver
          </Button>
          <div>
            <h1 className="text-xl font-bold">{detailAssignment.exam_title || "Evaluación de pares"}</h1>
            <p className="text-sm text-slate-500">
              {detailAssignment.completed_reviews || 0} de {detailAssignment.total_reviews || 0} revisiones completadas
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{detailAssignment.completed_reviews || 0}</p>
              <p className="text-sm text-slate-500">Revisiones completadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{(detailAssignment.total_reviews || 0) - (detailAssignment.completed_reviews || 0)}</p>
              <p className="text-sm text-slate-500">Pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{detailAssignment.average_score?.toFixed(1) || "-"}</p>
              <p className="text-sm text-slate-500">Puntuación promedio</p>
            </CardContent>
          </Card>
        </div>

        {detailAssignment.reviews && detailAssignment.reviews.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Revisiones individuales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Revisor</TableHead>
                    <TableHead>Revisado</TableHead>
                    <TableHead className="text-center">Puntuación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comentario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailAssignment.reviews.map((review: any) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.reviewer_name || "Anónimo"}</TableCell>
                      <TableCell>{review.reviewee_name || "Alumno"}</TableCell>
                      <TableCell className="text-center">
                        {review.score != null ? (
                          <Badge className={review.score >= 14 ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" : review.score >= 11 ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"}>
                            {review.score}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={review.status === "completed" ? "default" : "secondary"}>
                          {review.status === "completed" ? "Completada" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-slate-500 truncate">{review.feedback || "-"}</p>
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
              <p className="text-slate-500 dark:text-slate-400">Las revisiones aún no han comenzado</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Assignments list
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Evaluación de Pares</h1>
          <p className="text-slate-500 dark:text-slate-400">Los alumnos evalúan el trabajo de sus compañeros</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Nueva evaluación
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : assignments && assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((assignment: any) => {
            const completed = assignment.completed_reviews || 0;
            const total = assignment.total_reviews || 1;
            const progress = Math.round((completed / total) * 100);
            return (
              <Card
                key={assignment.id}
                className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                onClick={() => setDetailId(assignment.id)}
              >
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{assignment.exam_title || "Evaluación"}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{completed}/{total} revisiones</span>
                        <span>{assignment.is_anonymous ? "Anónima" : "Con nombre"}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2">
                        <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className={progress === 100 ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"}>
                      {progress}%
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-6">
              <Users className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sin evaluaciones de pares</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">
              Crea una evaluación para que tus alumnos se evalúen entre sí
            </p>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Crear evaluación
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear evaluación de pares</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Examen</label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar examen" /></SelectTrigger>
                <SelectContent>
                  {correctedExams.map((exam: any) => (
                    <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Revisiones por alumno</label>
              <Input type="number" min={1} max={5} value={reviewsPerStudent} onChange={(e) => setReviewsPerStudent(Number(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Revisión anónima</label>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Fecha límite (opcional)</label>
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCreate} disabled={createReview.isPending} title={createReview.isPending ? "Procesando..." : undefined}>
              {createReview.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Crear evaluación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
