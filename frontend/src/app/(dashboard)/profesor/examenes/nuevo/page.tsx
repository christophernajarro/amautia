"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, ArrowRight } from "lucide-react";

export default function NuevoExamenPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo Examen</h1>
        <p className="text-muted-foreground">Configura y sube tu examen de referencia</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s <= step ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
            }`}>
              {s}
            </div>
            <span className={`text-sm ${s <= step ? "text-slate-900" : "text-slate-400"}`}>
              {s === 1 ? "Datos" : s === 2 ? "Referencia" : "Preguntas"}
            </span>
            {s < 3 && <ArrowRight className="h-4 w-4 text-slate-300 mx-2" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos del Examen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título del examen</Label>
              <Input placeholder="Ej: Examen Parcial - Álgebra" />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea placeholder="Descripción breve del examen..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Materia</Label>
                <Input placeholder="Selecciona materia" disabled />
                <p className="text-xs text-muted-foreground">Crea una materia primero</p>
              </div>
              <div className="space-y-2">
                <Label>Puntaje total</Label>
                <Input type="number" defaultValue={20} />
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="bg-indigo-600 hover:bg-indigo-700">
              Siguiente <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Examen de Referencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Sube el examen resuelto correctamente o el examen vacío con las respuestas aparte.
            </p>
            <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-indigo-300 transition-colors">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Arrastra tu archivo aquí</p>
              <p className="text-sm text-muted-foreground">PDF, imagen o Word (máx. 10MB)</p>
              <Button variant="outline" className="mt-3">Seleccionar archivo</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button onClick={() => setStep(3)} className="bg-indigo-600 hover:bg-indigo-700">
                Procesar con IA <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preguntas Extraídas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La IA extraerá las preguntas del examen. Podrás editarlas y configurar rúbricas.
            </p>
            <p className="text-sm text-slate-600 text-center py-8">
              Sube un examen de referencia primero para ver las preguntas extraídas.
            </p>
            <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
