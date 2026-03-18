"use client";

import { useState } from "react";
import { useLiveQuizzes, useCreateLiveQuiz, useProfesorExams } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Plus, Users, Clock, ChevronRight, Loader2, PlayCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; class: string }> = {
  created: { label: "Creado", class: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" },
  waiting: { label: "En espera", class: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" },
  active: { label: "En vivo", class: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 animate-pulse" },
  paused: { label: "Pausado", class: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300" },
  finished: { label: "Finalizado", class: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" },
  completed: { label: "Completado", class: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" },
};

export default function QuizEnVivoPage() {
  const { data: quizzes, isLoading } = useLiveQuizzes();
  const { data: exams } = useProfesorExams();
  const createQuiz = useCreateLiveQuiz();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [examId, setExamId] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState(30);

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("El titulo es obligatorio"); return; }
    try {
      await createQuiz.mutateAsync({
        title,
        exam_id: examId || undefined,
        time_per_question: timePerQuestion,
      });
      toast.success("Quiz en vivo creado");
      setCreateOpen(false);
      setTitle(""); setExamId(""); setTimePerQuestion(30);
    } catch (err: any) {
      toast.error(err.message || "Error al crear el quiz");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quiz en Vivo</h1>
          <p className="text-slate-500 dark:text-slate-400">Crea quizzes interactivos en tiempo real</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Nuevo quiz
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : quizzes && quizzes.length > 0 ? (
        <div className="space-y-3">
          {quizzes.map((quiz: any) => {
            const cfg = statusConfig[quiz.status] || statusConfig.created;
            return (
              <Link key={quiz.id} href={`/profesor/quiz-en-vivo/${quiz.id}`}>
                <Card className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
                        <Zap className="h-5 w-5 text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{quiz.title}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                          {quiz.pin_code && <span className="font-mono">PIN: {quiz.pin_code}</span>}
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{quiz.participant_count || 0}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{quiz.time_per_question || 30}s</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={cfg.class}>{cfg.label}</Badge>
                      <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mb-6">
              <Zap className="h-10 w-10 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Crea tu primer quiz en vivo</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">
              Los alumnos se unen con un PIN y responden preguntas en tiempo real
            </p>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Crear quiz
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear quiz en vivo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Titulo</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Repaso rapido - Capitulo 3" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Examen base (opcional)</label>
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar examen" /></SelectTrigger>
                <SelectContent>
                  {(exams as any[] || []).map((exam: any) => (
                    <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tiempo por pregunta (segundos)</label>
              <Input type="number" min={5} max={120} value={timePerQuestion} onChange={(e) => setTimePerQuestion(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCreate} disabled={createQuiz.isPending}>
              {createQuiz.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Crear quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
