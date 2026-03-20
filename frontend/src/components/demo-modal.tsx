"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Sparkles, CheckCircle, ArrowRight, Clock, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const demoSteps = [
  {
    title: "Paso 1: Sube el examen de referencia",
    description: "Toma una foto o sube el PDF del examen modelo con las respuestas correctas.",
    icon: Upload,
    color: "from-amber-500 to-orange-600",
    visual: (
      <div className="rounded-xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-8 text-center">
        <Upload className="h-12 w-12 text-amber-400 mx-auto mb-3" />
        <p className="text-white/60 font-medium">Examen_Historia_5A.pdf</p>
        <p className="text-sm text-white/30 mt-1">Subido correctamente</p>
        <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ animation: "grow 1.5s ease-out forwards", width: 0 }} />
        </div>
      </div>
    ),
  },
  {
    title: "Paso 2: La IA analiza los exámenes",
    description: "Sube los exámenes de tus alumnos. La IA procesa todo en paralelo en segundos.",
    icon: Sparkles,
    color: "from-violet-500 to-indigo-600",
    visual: (
      <div className="space-y-3">
        {["Juan Pérez", "María López", "Carlos Ruiz", "Ana Torres"].map((name, i) => (
          <div key={name} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <FileText className="h-5 w-5 text-violet-400 shrink-0" />
            <span className="text-sm text-white/70 flex-1">{name}</span>
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
        ))}
        <div className="flex items-center gap-2 text-sm text-violet-300 mt-2">
          <Clock className="h-4 w-4" />
          <span>Procesado en 28 segundos</span>
        </div>
      </div>
    ),
  },
  {
    title: "Paso 3: Resultados al instante",
    description: "Nota por pregunta, retroalimentación personalizada y estadísticas de clase.",
    icon: CheckCircle,
    color: "from-emerald-500 to-teal-600",
    visual: (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div>
            <p className="font-semibold text-white">Promedio de clase</p>
            <p className="text-sm text-white/40">25 alumnos evaluados</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-400">15.8</p>
            <p className="text-xs text-white/30">de 20</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Aprobados", value: "88%", color: "text-emerald-400" },
            { label: "Promedio", value: "79%", color: "text-amber-400" },
            { label: "Mejor nota", value: "19/20", color: "text-violet-400" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-lg bg-white/[0.03] text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-white/30 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-sm text-emerald-300">✓ Retroalimentación IA generada para cada alumno</p>
        </div>
      </div>
    ),
  },
];

export function DemoModal({ open, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = demoSteps[currentStep];

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      setCurrentStep(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setCurrentStep(0); } }}>
      <DialogContent className="sm:max-w-lg bg-[#0a0a12] border-white/[0.08] text-white p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="flex gap-1 px-6 pt-6">
          {demoSteps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= currentStep ? "bg-amber-500" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="p-6">
          {/* Step header */}
          <div className="flex items-center gap-3 mb-2">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
              <step.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Demostración</p>
              <h3 className="font-bold text-lg">{step.title}</h3>
            </div>
          </div>
          <p className="text-white/50 mb-6 ml-[52px]">{step.description}</p>

          {/* Step visual */}
          <div key={currentStep} className="mb-6">
            {step.visual}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/30">{currentStep + 1} de {demoSteps.length}</span>
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="border-white/10 text-white/60 hover:text-white">
                  Anterior
                </Button>
              )}
              <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-400 text-white font-semibold">
                {currentStep === demoSteps.length - 1 ? (
                  <>¡Pruébalo gratis!</>
                ) : (
                  <>Siguiente <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
