"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFlashcardSetDetail, useStudyCards, useReviewCard } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Brain, CheckCircle, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function FlashcardStudyPage() {
  const params = useParams();
  const router = useRouter();
  const setId = params.id as string;

  const { data: setDetail, isLoading: loadingSet } = useFlashcardSetDetail(setId);
  const { data: studyCards, isLoading: loadingCards } = useStudyCards(setId);
  const reviewCard = useReviewCard();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const currentCard = studyCards?.[currentIndex];
  const totalDue = studyCards?.length || 0;

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const handleReview = async (quality: number) => {
    if (!currentCard) return;
    try {
      await reviewCard.mutateAsync({ cardId: currentCard.id, quality });
      setReviewed((r) => r + 1);
      setIsFlipped(false);
      if (currentIndex < totalDue - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        toast.success("Has completado todas las tarjetas pendientes");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al registrar la revision");
    }
  };

  const isFinished = totalDue > 0 && currentIndex >= totalDue;
  const progress = totalDue > 0 ? Math.round((reviewed / totalDue) * 100) : 0;

  const masteredCount = setDetail?.mastered_count || 0;
  const learningCount = setDetail?.learning_count || 0;
  const dueCount = setDetail?.due_count || totalDue;

  if (loadingSet || loadingCards) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <div className="flex gap-3 justify-center"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/alumno/flashcards">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{setDetail?.title || "Flashcards"}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{setDetail?.description || ""}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
          <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{masteredCount}</p>
          <p className="text-xs text-emerald-600">Dominadas</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30">
          <Brain className="h-5 w-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{learningCount}</p>
          <p className="text-xs text-amber-600">Aprendiendo</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30">
          <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{dueCount}</p>
          <p className="text-xs text-indigo-600">Pendientes hoy</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{reviewed} de {totalDue} revisadas</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className="bg-indigo-600 h-2 rounded-full transition-all text-white" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {totalDue === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle className="h-12 w-12 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay tarjetas pendientes</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Vuelve mas tarde para repasar</p>
            <Link href="/alumno/flashcards">
              <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Volver a mis sets</Button>
            </Link>
          </CardContent>
        </Card>
      ) : isFinished ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle className="h-12 w-12 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sesion completada</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Revisaste {reviewed} tarjetas</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setCurrentIndex(0); setReviewed(0); setIsFlipped(false); }}>
                <RotateCcw className="h-4 w-4 mr-2" />Repetir
              </Button>
              <Link href="/alumno/flashcards">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Volver a mis sets</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : currentCard ? (
        <>
          {/* Flashcard with flip animation */}
          <div className="perspective-[1000px] cursor-pointer" onClick={handleFlip} style={{ perspective: "1000px" }}>
            <motion.div
              className="relative w-full h-64"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900 bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center p-8"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="text-center">
                  <Badge className="mb-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">Frente</Badge>
                  <p className="text-xl font-medium text-slate-900 dark:text-slate-100">{currentCard.front}</p>
                </div>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 shadow-lg flex items-center justify-center p-8"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="text-center">
                  <Badge className="mb-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">Reverso</Badge>
                  <p className="text-xl font-medium text-slate-900 dark:text-slate-100">{currentCard.back}</p>
                </div>
              </div>
            </motion.div>
          </div>

          <p className="text-center text-sm text-slate-400">Toca la tarjeta para voltearla</p>

          {/* SM-2 Quality Buttons */}
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-2"
            >
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleReview(0)}
                disabled={reviewCard.isPending}
                title={reviewCard.isPending ? "Procesando..." : undefined}
              >
                No se
              </Button>
              <Button
                variant="outline"
                className="border-amber-200 text-amber-600 hover:bg-amber-50"
                onClick={() => handleReview(2)}
                disabled={reviewCard.isPending}
                title={reviewCard.isPending ? "Procesando..." : undefined}
              >
                Dificil
              </Button>
              <Button
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => handleReview(3)}
                disabled={reviewCard.isPending}
                title={reviewCard.isPending ? "Procesando..." : undefined}
              >
                Bien
              </Button>
              <Button
                variant="outline"
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                onClick={() => handleReview(5)}
                disabled={reviewCard.isPending}
                title={reviewCard.isPending ? "Procesando..." : undefined}
              >
                Facil
              </Button>
            </motion.div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No se pudieron cargar las tarjetas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
