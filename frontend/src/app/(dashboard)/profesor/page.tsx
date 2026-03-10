"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, FileText, Sparkles, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

const stats = [
  { title: "Materias", value: "0", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Alumnos", value: "0", icon: Users, color: "text-green-600", bg: "bg-green-50" },
  { title: "Exámenes", value: "0", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
  { title: "Generados", value: "0", icon: Sparkles, color: "text-violet-600", bg: "bg-violet-50" },
];

export default function ProfesorDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido a tu panel de profesor</p>
        </div>
        <div className="flex gap-2">
          <Link href="/profesor/materias">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nueva Materia
            </Button>
          </Link>
          <Link href="/profesor/examenes/nuevo">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-1" /> Nuevo Examen
            </Button>
          </Link>
        </div>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Exámenes Recientes</CardTitle>
            <Link href="/profesor/examenes">
              <Button variant="ghost" size="sm">
                Ver todos <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay exámenes todavía. Crea tu primer examen.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Correcciones Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No hay correcciones pendientes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
