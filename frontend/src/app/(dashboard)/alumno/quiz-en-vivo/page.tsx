"use client";

import { useState, useEffect } from "react";
import { useJoinLiveQuiz, useSubmitLiveAnswer, useLiveQuizDetails, useLiveLeaderboard } from "@/lib/api-hooks";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Zap, Users, Timer, Trophy, CheckCircle, Loader2, Hash, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AlumnoQuizEnVivoPage() {
  const user = useAuthStore((s) => s.user);
  const [pinCode, setPinCode] = useState("");
  const [quizId, setQuizId] = useState<string>("");
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answered, setAnswered] = useState(false);

  const joinQuiz = useJoinLiveQuiz();
  const { data: quiz } = useLiveQuizDetails(quizId);
  const submitAnswer = useSubmitLiveAnswer(quizId);
  const { data: leaderboard } = useLiveLeaderboard(quizId);

  const handleJoin = async () => {
    if (!pinCode.trim()) { toast.error("Ingresa el código PIN"); return; }
    try {
      const result: any = await joinQuiz.mutateAsync({ pin_code: pinCode.trim() });
      setQuizId(result.quiz_id || result.id);
      toast.success("Te uniste al quiz");
    } catch (err: any) {
      toast.error(err.message || "Código inválido o quiz no encontrado");
    }
  };

  // Reset answer state when question changes
  useEffect(() => {
    setSelectedAnswer("");
    setAnswered(false);
  }, [quiz?.current_question_index]);

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) { toast.error("Selecciona una respuesta"); return; }
    try {
      await submitAnswer.mutateAsync({ question_index: quiz.current_question_index, answer: selectedAnswer });
      setAnswered(true);
      toast.success("Respuesta enviada");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar respuesta");
    }
  };

  // Not joined yet
  if (!quizId) {
    return (
      <div className="space-y-6 max-w-md mx-auto pt-12">
        <div className="text-center">
          <div className="h-20 w-20 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mx-auto mb-6">
            <Zap className="h-10 w-10 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Quiz en Vivo</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Ingresa el código PIN que te dio tu profesor</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Código PIN</label>
              <Input
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                className="text-center text-2xl font-mono tracking-widest h-14"
                maxLength={8}
              />
            </div>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
              onClick={handleJoin}
              disabled={joinQuiz.isPending}
            >
              {joinQuiz.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uniéndose...</> : <><Zap className="h-4 w-4 mr-2" />Únete al quiz</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = quiz?.status;
  const currentQuestion = quiz?.current_question;
  const timeLeft = quiz?.time_remaining;

  // Waiting for start
  if (status === "waiting" || status === "created") {
    return (
      <div className="space-y-6 max-w-md mx-auto pt-12 text-center">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
        <h2 className="text-xl font-bold">Esperando que comience el quiz...</h2>
        <p className="text-slate-500 dark:text-slate-400">{quiz?.title}</p>
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Users className="h-4 w-4" />
          <span>{quiz?.participant_count || 0} participantes conectados</span>
        </div>
      </div>
    );
  }

  // Finished
  if (status === "finished" || status === "completed") {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Quiz finalizado</h2>
          <p className="text-slate-500 dark:text-slate-400">{quiz?.title}</p>
        </div>

        {leaderboard?.rankings && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados finales</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Participante</TableHead>
                    <TableHead className="text-right">Puntos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.rankings.slice(0, 10).map((entry: any, idx: number) => {
                    const isMe = entry.user_id === user?.id;
                    return (
                      <TableRow key={entry.user_id || idx} className={isMe ? "bg-indigo-50 dark:bg-indigo-950/30 font-semibold" : ""}>
                        <TableCell>{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}</TableCell>
                        <TableCell>
                          {entry.name || "Participante"}
                          {isMe && <Badge className="ml-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs">Tu</Badge>}
                        </TableCell>
                        <TableCell className="text-right font-bold">{entry.score}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show leaderboard between questions
  if (status === "showing_leaderboard") {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="text-center">
          <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-2" />
          <h2 className="text-xl font-bold">Clasificación parcial</h2>
        </div>
        {leaderboard?.rankings && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {leaderboard.rankings.slice(0, 5).map((entry: any, idx: number) => {
                  const isMe = entry.user_id === user?.id;
                  return (
                    <div key={entry.user_id || idx} className={`flex items-center justify-between p-3 rounded-lg ${isMe ? "bg-indigo-50 dark:bg-indigo-950/30" : "bg-slate-50 dark:bg-slate-800/50"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}</span>
                        <span className={isMe ? "font-semibold" : ""}>{entry.name}</span>
                      </div>
                      <span className="font-bold">{entry.score} pts</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        <p className="text-center text-slate-400 text-sm">Siguiente pregunta en breve...</p>
      </div>
    );
  }

  // Active question
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <Badge className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
          Pregunta {(quiz?.current_question_index || 0) + 1} de {quiz?.total_questions || "?"}
        </Badge>
        {timeLeft != null && (
          <Badge className={`${timeLeft <= 5 ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
            <Timer className="h-3 w-3 mr-1" />{timeLeft}s
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-6">{currentQuestion?.text || "Cargando pregunta..."}</h2>

          {answered ? (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-lg font-medium">Respuesta enviada</p>
              <p className="text-sm text-slate-400">Esperando la siguiente pregunta...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(currentQuestion?.options || []).map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAnswer(option)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedAnswer === option
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      selectedAnswer === option ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!answered && (
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
          onClick={handleSubmitAnswer}
          disabled={!selectedAnswer || submitAnswer.isPending}
        >
          {submitAnswer.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : "Enviar respuesta"}
        </Button>
      )}
    </div>
  );
}
