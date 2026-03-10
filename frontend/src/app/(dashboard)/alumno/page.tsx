"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Brain, BarChart3, Plus } from "lucide-react";
import Link from "next/link";

const stats = [
  { title: "Materias", value: "0", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Exámenes", value: "0", icon: FileText, color: "text-green-600", bg: "bg-green-50" },
  { title: "Sesiones Tutor", value: "0", icon: Brain, color: "text-violet-600", bg: "bg-violet-50" },
  { title: "Promedio", value: "-", icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50" },
];

export default function AlumnoDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Dashboard</h1>
          <p className="text-muted-foreground">Resumen de tu actividad</p>
        </div>
        <Link href="/alumno/unirse">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-1" /> Unirme a clase
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exámenes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay exámenes corregidos todavía</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tutor IA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Inicia una sesión con tu tutor personalizado</p>
            <Link href="/alumno/tutor">
              <Button variant="outline" size="sm" className="mt-3">
                <Brain className="h-4 w-4 mr-1" /> Ir al Tutor
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
