"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare, BookOpen, Target, Plus } from "lucide-react";

export default function TutorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tutor IA</h1>
          <p className="text-muted-foreground">Tu tutor personalizado con inteligencia artificial</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-1" /> Nueva conversación
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-violet-600" />
            </div>
            <h3 className="font-semibold mb-1">Chat con Tutor</h3>
            <p className="text-sm text-muted-foreground">Pregunta dudas sobre tus exámenes</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">Plan de Estudio</h3>
            <p className="text-sm text-muted-foreground">Plan personalizado según tus debilidades</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold mb-1">Ejercicios</h3>
            <p className="text-sm text-muted-foreground">Practica con ejercicios adaptados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversaciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No tienes conversaciones. Inicia una nueva para empezar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
