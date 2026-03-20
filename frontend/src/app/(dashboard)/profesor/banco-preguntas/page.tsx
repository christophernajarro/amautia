"use client";

import { useState } from "react";
import { useQuestionBanks, useCreateQuestionBank, useQuestionBankItems, useAddBankItem, useGenerateExamFromBank } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Plus, FileText, Sparkles, ArrowLeft, Loader2, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";

export default function BancoPreguntasPage() {
  const { data: banks, isLoading } = useQuestionBanks();
  const createBank = useCreateQuestionBank();
  const addItem = useAddBankItem();
  const generateExam = useGenerateExamFromBank();

  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const { data: items, isLoading: loadingItems } = useQuestionBankItems(selectedBankId);

  const [createOpen, setCreateOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankDesc, setBankDesc] = useState("");
  const [bankSubject, setBankSubject] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("multiple_choice");
  const [qDifficulty, setQDifficulty] = useState("medium");
  const [qTags, setQTags] = useState("");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qAnswer, setQAnswer] = useState("");

  const [genOpen, setGenOpen] = useState(false);
  const [genTitle, setGenTitle] = useState("");
  const [genCount, setGenCount] = useState(10);
  const [genBankIds, setGenBankIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");

  const handleCreateBank = async () => {
    if (!bankName.trim()) { toast.error("El nombre es obligatorio"); return; }
    try {
      await createBank.mutateAsync({ name: bankName, description: bankDesc, subject: bankSubject });
      toast.success("Banco creado");
      setCreateOpen(false);
      setBankName(""); setBankDesc(""); setBankSubject("");
    } catch (err: any) {
      toast.error(err.message || "Error al crear el banco");
    }
  };

  const handleAddItem = async () => {
    if (!qText.trim()) { toast.error("La pregunta es obligatoria"); return; }
    try {
      const data: any = {
        bankId: selectedBankId,
        question_text: qText,
        question_type: qType,
        difficulty: qDifficulty,
        tags: qTags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (qType === "multiple_choice") {
        data.options = qOptions.filter(Boolean);
        data.correct_answer = qAnswer;
      } else {
        data.correct_answer = qAnswer;
      }
      await addItem.mutateAsync(data);
      toast.success("Pregunta agregada");
      setAddOpen(false);
      setQText(""); setQOptions(["", "", "", ""]); setQAnswer(""); setQTags("");
    } catch (err: any) {
      toast.error(err.message || "Error al agregar pregunta");
    }
  };

  const handleGenerateExam = async () => {
    if (!genTitle.trim()) { toast.error("El titulo es obligatorio"); return; }
    try {
      await generateExam.mutateAsync({ title: genTitle, question_count: genCount, bank_ids: genBankIds.length > 0 ? genBankIds : [selectedBankId] });
      toast.success("Examen generado desde el banco");
      setGenOpen(false);
      setGenTitle(""); setGenCount(10);
    } catch (err: any) {
      toast.error(err.message || "Error al generar examen");
    }
  };

  const filteredItems = items?.filter((item: any) =>
    item.question_text?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const difficultyColors: Record<string, string> = {
    easy: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
    medium: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
    hard: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
  };

  // Detail view
  if (selectedBankId) {
    const selectedBank = banks?.find((b: any) => b.id === selectedBankId);
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedBankId("")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedBank?.name || "Banco"}</h1>
              <p className="text-slate-500 dark:text-slate-400">{selectedBank?.description || "Preguntas del banco"}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setGenOpen(true)} className="flex-1 sm:flex-initial">
              <Sparkles className="h-4 w-4 mr-2" />Generar examen
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1 sm:flex-initial" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Agregar pregunta
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input placeholder="Buscar preguntas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loadingItems ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : filteredItems.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pregunta</TableHead>
                    <TableHead className="w-28">Tipo</TableHead>
                    <TableHead className="w-28">Dificultad</TableHead>
                    <TableHead className="w-36">Etiquetas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-md">
                        <p className="truncate">{item.question_text}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {item.question_type === "multiple_choice" ? "Opcion multiple" : item.question_type === "true_false" ? "V/F" : "Abierta"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${difficultyColors[item.difficulty] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                          {item.difficulty === "easy" ? "Facil" : item.difficulty === "hard" ? "Dificil" : "Media"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(item.tags || []).slice(0, 2).map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
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
              <Database className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Este banco no tiene preguntas aun</p>
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Agregar primera pregunta
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add question dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Agregar pregunta</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Pregunta</label>
                <Textarea value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Escribe la pregunta..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Tipo</label>
                  <Select value={qType} onValueChange={setQType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Opcion multiple</SelectItem>
                      <SelectItem value="true_false">Verdadero/Falso</SelectItem>
                      <SelectItem value="open">Abierta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Dificultad</label>
                  <Select value={qDifficulty} onValueChange={setQDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Facil</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="hard">Dificil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {qType === "multiple_choice" && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Opciones</label>
                  <div className="space-y-2">
                    {qOptions.map((opt, idx) => (
                      <Input key={idx} value={opt} onChange={(e) => { const o = [...qOptions]; o[idx] = e.target.value; setQOptions(o); }} placeholder={`Opcion ${idx + 1}`} />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Respuesta correcta</label>
                <Input value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} placeholder="Respuesta correcta" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Etiquetas (separadas por comas)</label>
                <Input value={qTags} onChange={(e) => setQTags(e.target.value)} placeholder="algebra, ecuaciones" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleAddItem} disabled={addItem.isPending} title={addItem.isPending ? "Procesando..." : undefined}>
                {addItem.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Agregando...</> : "Agregar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate exam dialog */}
        <Dialog open={genOpen} onOpenChange={setGenOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Generar examen desde banco</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Titulo del examen</label>
                <Input value={genTitle} onChange={(e) => setGenTitle(e.target.value)} placeholder="Ej: Examen parcial - Algebra" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Cantidad de preguntas</label>
                <Input type="number" min={1} max={100} value={genCount} onChange={(e) => setGenCount(Number(e.target.value))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenOpen(false)}>Cancelar</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleGenerateExam} disabled={generateExam.isPending} title={generateExam.isPending ? "Procesando..." : undefined}>
                {generateExam.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</> : <><Sparkles className="h-4 w-4 mr-2" />Generar</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Banks list
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Banco de Preguntas</h1>
          <p className="text-slate-500 dark:text-slate-400">Organiza y reutiliza tus preguntas</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Nuevo banco
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : banks && banks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banks.map((bank: any) => (
            <Card key={bank.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedBankId(bank.id)}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                    <Database className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{bank.name}</h3>
                    {bank.subject && <p className="text-sm text-slate-500">{bank.subject}</p>}
                  </div>
                </div>
                {bank.description && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{bank.description}</p>}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{bank.question_count || 0} preguntas</Badge>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(bank.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-6">
              <Database className="h-10 w-10 text-indigo-400 dark:text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Crea tu primer banco</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">Organiza preguntas por tema y reutilizalas en multiples examenes</p>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Crear banco
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create bank dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear banco de preguntas</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nombre</label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ej: Algebra Lineal" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Materia</label>
              <Input value={bankSubject} onChange={(e) => setBankSubject(e.target.value)} placeholder="Ej: Matematicas" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descripción (opcional)</label>
              <Textarea value={bankDesc} onChange={(e) => setBankDesc(e.target.value)} placeholder="Descripción del banco" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateBank} disabled={createBank.isPending} title={createBank.isPending ? "Procesando..." : undefined}>
              {createBank.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Crear banco"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
