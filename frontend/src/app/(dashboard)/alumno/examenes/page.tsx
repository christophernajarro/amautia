
"use client";

import { useAlumnoExams } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

export default function AlumnoExamenesPage() {
  const { data: exams, isLoading } = useAlumnoExams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mis Exámenes</h1>
        <p className="text-slate-500">Exámenes corregidos y sus resultados</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : exams?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium mb-1">Sin exámenes</h3>
            <p className="text-sm text-slate-500">Cuando tu profesor corrija un examen tuyo, aparecerá aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exams?.map((e: any) => (
            <Card key={e.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{e.exam_title}</p>
                  <p className="text-sm text-slate-500">{e.subject_name}</p>
                </div>
                <div className="text-right">
                  {e.total_score != null && <p className="text-lg font-bold text-indigo-600">{e.total_score}</p>}
                  {e.percentage != null && <p className="text-sm text-slate-500">{e.percentage}%</p>}
                  <Badge variant={e.status === "corrected" ? "default" : "secondary"}>{e.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
