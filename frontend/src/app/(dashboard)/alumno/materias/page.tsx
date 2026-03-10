// @ts-nocheck
"use client";

import { useAlumnoSections } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Plus, User } from "lucide-react";

export default function AlumnoMateriasPage() {
  const { data: sections, isLoading } = useAlumnoSections();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Materias</h1>
          <p className="text-slate-500">Secciones en las que estás inscrito</p>
        </div>
        <Link href="/alumno/unirse"><Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Unirme</Button></Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : sections?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">Sin materias</h3>
            <p className="text-sm text-slate-500 mb-4">Únete a una clase con el código de tu profesor</p>
            <Link href="/alumno/unirse"><Button className="bg-indigo-600 hover:bg-indigo-700">Unirme a clase</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections?.map((s: any) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.subject_color + "20" }}>
                    <BookOpen className="h-5 w-5" style={{ color: s.subject_color }} />
                  </div>
                  <div>
                    <h3 className="font-medium">{s.subject_name}</h3>
                    <p className="text-sm text-slate-500">{s.name}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                      <User className="h-3 w-3" />{s.profesor_name}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
