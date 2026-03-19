"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, BookOpen, FileText, ArrowRight, Check, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  userName: string;
  open: boolean;
  onClose: () => void;
}

export function OnboardingWizard({ userName, open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [subjectName, setSubjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreateSubject = async () => {
    if (!subjectName.trim()) return;
    setCreating(true);
    try {
      const token = getTokens().access;
      await apiFetch("/profesor/subjects", {
        method: "POST",
        body: JSON.stringify({ name: subjectName }),
        token: token!,
      });
      toast.success("¡Materia creada!");
      setStep(2);
    } catch {
      toast.error("Error al crear materia");
    } finally {
      setCreating(false);
    }
  };

  const steps = [
    // Step 0: Welcome
    <div key={0} className="text-center py-4">
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20">
        <GraduationCap className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-2">¡Bienvenido, {userName}!</h2>
      <p className="text-muted-foreground text-lg mb-8">Te ayudaremos a configurar tu cuenta en menos de 2 minutos.</p>
      <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
        {["Crea tu primera materia", "Sube un examen de referencia", "La IA corrige por ti"].map((t, i) => (
          <div key={i} className="flex items-center gap-3 text-base">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-bold text-amber-700 dark:text-amber-300">{i + 1}</div>
            {t}
          </div>
        ))}
      </div>
      <Button onClick={() => setStep(1)} className="h-12 px-8 text-base bg-primary text-primary-foreground">
        Empezar <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>,
    // Step 1: Create subject
    <div key={1} className="text-center py-4">
      <div className="h-16 w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-6">
        <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Crea tu primera materia</h2>
      <p className="text-muted-foreground mb-6">¿Qué materia enseñas? Puedes agregar más después.</p>
      <div className="max-w-sm mx-auto space-y-4">
        <Input
          placeholder="Ej: Matemáticas, Historia, Ciencias..."
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          className="h-12 text-base text-center"
          onKeyDown={(e) => e.key === "Enter" && handleCreateSubject()}
          autoFocus
        />
        <Button onClick={handleCreateSubject} disabled={!subjectName.trim() || creating} className="h-12 w-full text-base bg-primary text-primary-foreground">
          {creating ? "Creando..." : "Crear materia"}
        </Button>
        <button onClick={() => { onClose(); }} className="text-sm text-muted-foreground hover:underline">
          Saltar por ahora
        </button>
      </div>
    </div>,
    // Step 2: Success
    <div key={2} className="text-center py-4">
      <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
        <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">¡Todo listo!</h2>
      <p className="text-muted-foreground text-lg mb-8">Tu materia fue creada. Ahora puedes crear tu primer examen.</p>
      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        <Button onClick={() => { onClose(); router.push("/profesor/examenes/nuevo"); }} className="h-12 text-base bg-primary text-primary-foreground">
          <FileText className="h-5 w-5 mr-2" /> Crear mi primer examen
        </Button>
        <Button variant="outline" onClick={() => { onClose(); router.push("/profesor/generar"); }} className="h-12 text-base">
          <Sparkles className="h-5 w-5 mr-2" /> Generar examen con IA
        </Button>
        <button onClick={onClose} className="text-sm text-muted-foreground hover:underline mt-2">
          Explorar el dashboard
        </button>
      </div>
    </div>,
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${step === i ? "w-8 bg-primary" : "w-2 bg-muted"}`} />
          ))}
        </div>
        {steps[step]}
      </DialogContent>
    </Dialog>
  );
}
