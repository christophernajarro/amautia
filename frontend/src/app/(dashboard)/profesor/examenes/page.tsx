"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";

export default function ExamenesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Exámenes</h1>
          <p className="text-muted-foreground">Gestiona y corrige tus exámenes</p>
        </div>
        <Link href="/profesor/examenes/nuevo">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-1" /> Nuevo Examen
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3" />
          <p className="font-medium text-lg">No hay exámenes todavía</p>
          <p className="text-sm mb-4">Crea tu primer examen para empezar a corregir con IA</p>
          <Link href="/profesor/examenes/nuevo">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-1" /> Crear Examen
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
