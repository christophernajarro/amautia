// @ts-nocheck
"use client";

import { useAlumnoDashboard } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { BookOpen, FileText, BarChart3, Plus } from "lucide-react";

export default function AlumnoDashboard() {
  const { data, isLoading } = useAlumnoDashboard();

  const stats = [
    { label: "Mis secciones", value: data?.total_sections || 0, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Exámenes", value: data?.total_exams || 0, icon: FileText, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Promedio", value: data?.average_score ? `${data.average_score.toFixed(1)}%` : "—", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Dashboard</h1>
          <p className="text-slate-500">Bienvenido, alumno</p>
        </div>
        <Link href="/alumno/unirse">
          <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Unirme a clase</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{s.value}</p>}
                  <p className="text-sm text-slate-500">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Exámenes recientes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 text-center py-6">No tienes exámenes corregidos aún.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Acciones rápidas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Link href="/alumno/unirse" className="block">
              <Button variant="outline" className="w-full justify-start"><Plus className="h-4 w-4 mr-2" />Unirme a una clase con código</Button>
            </Link>
            <Link href="/alumno/materias" className="block">
              <Button variant="outline" className="w-full justify-start"><BookOpen className="h-4 w-4 mr-2" />Ver mis materias</Button>
            </Link>
            <Link href="/alumno/tutor" className="block">
              <Button variant="outline" className="w-full justify-start"><BarChart3 className="h-4 w-4 mr-2" />Hablar con el tutor IA</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
