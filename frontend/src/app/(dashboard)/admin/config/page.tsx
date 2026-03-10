"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración General</h1>
        <p className="text-muted-foreground">Ajustes globales de la plataforma</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Número de Yape</Label>
              <Input placeholder="999999999" />
            </div>
            <div className="space-y-2">
              <Label>Número de Plin</Label>
              <Input placeholder="888888888" />
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="h-4 w-4 mr-1" /> Guardar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Requiere aprobación de admin</p>
                <p className="text-xs text-muted-foreground">Los nuevos registros necesitan aprobación manual</p>
              </div>
              <Button variant="outline" size="sm">Desactivado</Button>
            </div>
            <div className="space-y-2">
              <Label>Escala de calificación por defecto</Label>
              <Input value="0-20" readOnly />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
