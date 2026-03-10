"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles } from "lucide-react";

export default function GenerarExamenPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Generar Examen</h1>
        <p className="text-muted-foreground">Crea un examen similar basado en material existente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Material Fuente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-indigo-300 transition-colors">
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">Sube un examen, PDF o documento</p>
            <p className="text-sm text-muted-foreground">O escribe los temas abajo</p>
          </div>
          <div className="space-y-2">
            <Label>Temas / Contenido (opcional)</Label>
            <Textarea placeholder="Escribe los temas que quieres cubrir en el examen..." rows={4} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dificultad</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Más fácil</Button>
                <Button variant="default" size="sm" className="flex-1 bg-indigo-600">Igual</Button>
                <Button variant="outline" size="sm" className="flex-1">Más difícil</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Número de preguntas</Label>
              <Input type="number" defaultValue={10} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipos de preguntas</Label>
            <div className="flex flex-wrap gap-2">
              {["Opción múltiple", "Desarrollo", "V/F", "Completar", "Matemáticas"].map((type) => (
                <Button key={type} variant="outline" size="sm">{type}</Button>
              ))}
            </div>
          </div>

          <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Sparkles className="h-4 w-4 mr-1" /> Generar Examen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
