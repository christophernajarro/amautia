"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

export default function AlumnoMateriasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Materias</h1>
          <p className="text-muted-foreground">Materias en las que estás inscrito</p>
        </div>
        <Link href="/alumno/unirse">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-1" /> Unirme a clase
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mb-3" />
          <p className="font-medium text-lg">No estás inscrito en ninguna materia</p>
          <p className="text-sm mb-4">Únete a una clase con el código de tu profesor</p>
          <Link href="/alumno/unirse">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Unirme a una clase
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
