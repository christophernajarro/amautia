"use client";

import { useParams } from "next/navigation";
import { useLiveQuizDetails, useLiveQuizAction, useLiveLeaderboard } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Play, Pause, SkipForward, StopCircle, Users, Hash, Trophy, Zap, Copy, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function QuizControlPage() {
  const params = useParams();
  const quizId = params.id as string;

  const { data: quiz, isLoading } = useLiveQuizDetails(quizId);
  const action = useLiveQuizAction(quizId);
  const { data: leaderboard } = useLiveLeaderboard(quizId);

  const handleAction = async (act: string) => {
    try {
      await action.mutateAsync(act);
      const labels: Record<string, string> = { start: "Quiz iniciado", pause: "Quiz pausado", resume: "Quiz reanudado", next: "Siguiente pregunta", finish: "Quiz finalizado" };
      toast.success(labels[act] || "Accion ejecutada");
    } catch (err: any) {
      toast.error(err.message || "Error al ejecutar la accion");
    }
  };

  const copyPin = () => {
    if (quiz?.pin_code) {
      navigator.clipboard.writeText(quiz.pin_code);
      toast.success("PIN copiado al portapapeles");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const status = quiz?.status;
  const isActive = status === "active" || status === "in_progress";
  const isWaiting = status === "waiting" || status === "created";
  const isFinished = status === "finished" || status === "completed";
  const isPaused = status === "paused";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profesor/quiz-en-vivo">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{quiz?.title || "Quiz en vivo"}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={isActive ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 animate-pulse" : isFinished ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"}>
              {isActive ? "En vivo" : isFinished ? "Finalizado" : isPaused ? "Pausado" : "Esperando"}
            </Badge>
            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />{quiz?.participant_count || 0} participantes
            </span>
          </div>
        </div>
      </div>

      {/* PIN Code Display */}
      <Card className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30">
        <CardContent className="flex flex-col items-center py-8">
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-2">Codigo PIN para unirse</p>
          <div className="flex items-center gap-3">
            <p className="text-5xl font-mono font-bold text-indigo-700 dark:text-indigo-300 tracking-[0.3em]">{quiz?.pin_code || "------"}</p>
            <Button variant="ghost" size="icon" onClick={copyPin}>
              <Copy className="h-5 w-5 text-indigo-500" />
            </Button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Los alumnos ingresan este código en su pantalla</p>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        {(isWaiting || isPaused) && (
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(isWaiting ? "start" : "resume")} disabled={action.isPending} title={action.isPending ? "Procesando..." : undefined}>
            {action.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            {isWaiting ? "Iniciar quiz" : "Reanudar"}
          </Button>
        )}
        {isActive && (
          <>
            <Button variant="outline" onClick={() => handleAction("pause")} disabled={action.isPending} title={action.isPending ? "Procesando..." : undefined}>
              <Pause className="h-4 w-4 mr-2" />Pausar
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleAction("next")} disabled={action.isPending} title={action.isPending ? "Procesando..." : undefined}>
              <SkipForward className="h-4 w-4 mr-2" />Siguiente pregunta
            </Button>
          </>
        )}
        {(isActive || isPaused) && (
          <Button variant="outline" className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleAction("finish")} disabled={action.isPending} title={action.isPending ? "Procesando..." : undefined}>
            <StopCircle className="h-4 w-4 mr-2" />Finalizar
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Question */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-violet-500" />
              Pregunta actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quiz?.current_question ? (
              <div>
                <Badge className="mb-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  Pregunta {(quiz.current_question_index || 0) + 1} de {quiz.total_questions || "?"}
                </Badge>
                <p className="text-lg font-medium mb-4">{quiz.current_question.text}</p>
                {quiz.current_question.options && (
                  <div className="space-y-2">
                    {quiz.current_question.options.map((opt: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <div className="h-7 w-7 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
                {quiz.answers_count != null && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{quiz.answers_count} respuestas recibidas</p>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-400 dark:text-slate-500 py-8">
                {isWaiting ? "Inicia el quiz para mostrar la primera pregunta" : isFinished ? "Quiz finalizado" : "Cargando pregunta..."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Clasificacion en tiempo real
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard?.rankings && leaderboard.rankings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead className="text-right">Puntos</TableHead>
                    <TableHead className="text-right">Correctas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.rankings.map((entry: any, idx: number) => (
                    <TableRow key={entry.user_id || idx}>
                      <TableCell className="font-bold">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}</TableCell>
                      <TableCell>{entry.name || "Participante"}</TableCell>
                      <TableCell className="text-right font-semibold">{entry.score}</TableCell>
                      <TableCell className="text-right">{entry.correct_answers || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-slate-400 dark:text-slate-500 py-8">Sin participantes aun</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Participants list */}
      {quiz?.participants && quiz.participants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participantes ({quiz.participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quiz.participants.map((p: any, idx: number) => (
                <Badge key={p.id || idx} variant="secondary">{p.name || p.student_name || `Participante ${idx + 1}`}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
