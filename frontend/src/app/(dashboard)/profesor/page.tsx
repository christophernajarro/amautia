// @ts-nocheck
"use client";

import { useProfesorDashboard } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, Users, FileText, BarChart3, Plus, ArrowRight } from "lucide-react";

export default function ProfesorDashboard() {
  const { data, isLoading } = useProfesorDashboard();

  const stats = [
    { label: "Materias", value: data?.total_subjects || 0, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50", href: "/profesor/materias" },
    { label: "Secciones", value: data?.total_sections || 0, icon: BarChart3, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Alumnos", value: data?.total_students || 0, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", href: "/profesor/alumnos" },
    { label: "Exámenes", value: data?.total_exams || 0, icon: FileText, color: "text-amber-600", bg: "bg-amber-50", href: "/profesor/examenes" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Bienvenido, profesor</p>
        </div>
        <div className="flex gap-3">
          <Link href="/profesor/materias"><Button variant="outline"><Plus className="h-4 w-4 mr-2" />Nueva materia</Button></Link>
          <Link href="/profesor/examenes/nuevo"><Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Nuevo examen</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow cursor-pointer">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Exámenes recientes</CardTitle>
          <Link href="/profesor/examenes"><Button variant="ghost" size="sm">Ver todos <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-20" /> : data?.recent_exams?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No has creado exámenes aún. ¡Empieza creando uno!</p>
          ) : (
            <div className="space-y-3">
              {data?.recent_exams?.map((exam: any) => (
                <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-sm text-slate-500">Puntos: {exam.total_points}</p>
                  </div>
                  <Badge variant={exam.status === "published" ? "default" : "secondary"}>{exam.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
