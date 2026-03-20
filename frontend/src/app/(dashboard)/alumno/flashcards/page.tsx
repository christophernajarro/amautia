"use client";

import { useState } from "react";
import { useFlashcardSets, useCreateFlashcardSet, useGenerateFlashcards } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Layers, Plus, Sparkles, BookOpen, Trash2, Loader2, AlertCircle, GraduationCap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function FlashcardsPage() {
  const { data: sets, isLoading } = useFlashcardSets();
  const createSet = useCreateFlashcardSet();
  const generateCards = useGenerateFlashcards();

  const [createOpen, setCreateOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState([{ front: "", back: "" }]);

  const [genSubject, setGenSubject] = useState("");
  const [genTopic, setGenTopic] = useState("");
  const [genCount, setGenCount] = useState(10);

  const addCard = () => setCards([...cards, { front: "", back: "" }]);
  const removeCard = (idx: number) => setCards(cards.filter((_, i) => i !== idx));
  const updateCard = (idx: number, field: "front" | "back", value: string) => {
    const updated = [...cards];
    updated[idx][field] = value;
    setCards(updated);
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("El titulo del set es obligatorio"); return; }
    const validCards = cards.filter((c) => c.front.trim() && c.back.trim());
    if (validCards.length === 0) { toast.error("Agrega al menos una tarjeta con frente y reverso completos"); return; }
    try {
      await createSet.mutateAsync({ title, description, cards: validCards });
      toast.success("Set de tarjetas creado");
      setCreateOpen(false);
      setTitle(""); setDescription(""); setCards([{ front: "", back: "" }]);
    } catch (err: any) {
      toast.error(err.message || "No se pudo crear el set. Revisa tu conexión e intenta de nuevo.");
    }
  };

  const handleGenerate = async () => {
    if (!genSubject.trim() || !genTopic.trim()) { toast.error("Ingresa la materia y el tema para generar tarjetas"); return; }
    try {
      await generateCards.mutateAsync({ subject: genSubject, topic: genTopic, count: genCount });
      toast.success("Tarjetas generadas con IA");
      setGenOpen(false);
      setGenSubject(""); setGenTopic(""); setGenCount(10);
    } catch (err: any) {
      toast.error(err.message || "No se pudieron generar las tarjetas. Verifica los datos e intenta de nuevo.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mis Flashcards</h1>
          <p className="text-slate-500 dark:text-slate-400">Estudia con tarjetas de repaso espaciado</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setGenOpen(true)} className="flex-1 sm:flex-initial">
            <Sparkles className="h-4 w-4 mr-2" />Generar con IA
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1 sm:flex-initial text-white" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Nuevo set
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <Skeleton className="h-5 w-3/4 rounded mb-1" />
                <Skeleton className="h-4 w-full rounded mb-3" />
                <div className="mb-3 space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12 rounded" />
                    <Skeleton className="h-3 w-8 rounded" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <Skeleton className="h-9 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sets && sets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set: any) => {
            const mastery = set.mastery_percentage ?? 0;
            return (
              <Card key={set.id} className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-violet-600" />
                    </div>
                    <span className="text-xs text-slate-400">{set.card_count || 0} tarjetas</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{set.title}</h3>
                  {set.description && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{set.description}</p>}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>Dominio</span>
                      <span>{Math.round(mastery)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 shadow-inner">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${mastery >= 80 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : mastery >= 50 ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-indigo-500 to-indigo-400"}`}
                        style={{ width: `${mastery}%` }}
                      />
                    </div>
                  </div>
                  <Link href={`/alumno/flashcards/${set.id}`}>
                    <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                      <BookOpen className="h-4 w-4 mr-2" />Estudiar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-24 w-24 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center mb-6 ring-4 ring-violet-50 dark:ring-violet-950/20">
              <GraduationCap className="h-12 w-12 text-violet-500 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Crea tus primeras tarjetas</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">
              Las flashcards te ayudan a memorizar usando repaso espaciado
            </p>
            <div className="flex gap-3">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Crear manual
              </Button>
              <Button variant="outline" onClick={() => setGenOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />Generar con IA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Set Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear set de tarjetas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Titulo</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Vocabulario de biologia" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descripción (opcional)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descripción del set" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Tarjetas</label>
                <Button variant="outline" size="sm" onClick={addCard}><Plus className="h-3 w-3 mr-1" />Agregar</Button>
              </div>
              <div className="space-y-3">
                {cards.map((card, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input placeholder="Frente" value={card.front} onChange={(e) => updateCard(idx, "front", e.target.value)} />
                      <Input placeholder="Reverso" value={card.back} onChange={(e) => updateCard(idx, "back", e.target.value)} />
                    </div>
                    {cards.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeCard(idx)} className="shrink-0 mt-1">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleCreate} disabled={createSet.isPending} title={createSet.isPending ? "Procesando..." : undefined}>
              {createSet.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Crear set"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate with AI Dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar tarjetas con IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Materia</label>
              <Input value={genSubject} onChange={(e) => setGenSubject(e.target.value)} placeholder="Ej: Biologia" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tema</label>
              <Input value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="Ej: La celula y sus organelos" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Cantidad de tarjetas</label>
              <Input type="number" min={5} max={50} value={genCount} onChange={(e) => setGenCount(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleGenerate} disabled={generateCards.isPending} title={generateCards.isPending ? "Procesando..." : undefined}>
              {generateCards.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</> : <><Sparkles className="h-4 w-4 mr-2" />Generar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
