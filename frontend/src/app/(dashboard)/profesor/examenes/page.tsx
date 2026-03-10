// @ts-nocheck
"use client";

import { useProfesorExams } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";

const statusMap: Record<string, { label: string; class: string }> = {
  draft: { label: "Borrador", class: "bg-slate-100 text-slate-700" },
  processing: { label: "Procesando", class: "bg-blue-100 text-blue-700" },
  ready: { label: "Listo", class: "bg-green-100 text-green-700" },
  correcting: { label: "Corrigiendo", class: "bg-yellow-100 text-yellow-700" },
  published: { label: "Publicado", class: "bg-indigo-100 text-indigo-700" },
};

export default function ExamenesPage() {
  const { data: exams, isLoading } = useProfesorExams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exámenes</h1>
          <p className="text-slate-500">Gestiona tus exámenes y correcciones</p>
        </div>
        <Link href="/profesor/examenes/nuevo">
          <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Nuevo examen</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : exams?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">Sin exámenes</h3>
            <p className="text-sm text-slate-500 mb-4">Crea tu primer examen para empezar a corregir con IA</p>
            <Link href="/profesor/examenes/nuevo">
              <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Crear examen</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exams?.map((exam: any) => (
            <Card key={exam.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{exam.title}</p>
                    <p className="text-sm text-slate-500">{exam.total_points} puntos · {exam.grading_scale}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusMap[exam.status]?.class || ""}>{statusMap[exam.status]?.label || exam.status}</Badge>
                  <p className="text-xs text-slate-400">{new Date(exam.created_at).toLocaleDateString("es-PE")}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
