// @ts-nocheck
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Brain, Send } from "lucide-react";

export default function TutorPage() {
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tutor IA</h1>
        <p className="text-slate-500">Tu asistente de estudio personalizado</p>
      </div>

      <Card className="h-[calc(100vh-250px)] flex flex-col">
        <CardContent className="flex-1 flex flex-col justify-center items-center">
          <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
            <Brain className="h-10 w-10 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">¡Hola! Soy tu tutor IA</h3>
          <p className="text-slate-500 text-center max-w-md mb-6">
            Puedo ayudarte a estudiar, resolver dudas, crear planes de estudio y generar ejercicios de práctica.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Explícame un tema", "Crea ejercicios de práctica", "Plan de estudio", "Tengo dudas sobre mi examen"].map((s) => (
              <Button key={s} variant="outline" size="sm" onClick={() => setMessage(s)}>{s}</Button>
            ))}
          </div>
        </CardContent>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input placeholder="Escribe tu mensaje..." value={message} onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && message && setMessage("")} />
            <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={!message}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">El tutor IA estará disponible próximamente</p>
        </div>
      </Card>
    </div>
  );
}
