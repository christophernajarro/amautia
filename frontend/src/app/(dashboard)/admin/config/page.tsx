
"use client";

import { useAdminConfig } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

export default function ConfigPage() {
  const { data: configs, isLoading } = useAdminConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500">Configuración global del sistema</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="space-y-4">
          {configs?.map((c: any) => (
            <Card key={c.key}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center mt-0.5">
                      <Settings className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{c.key}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{c.description || "Sin descripción"}</p>
                      <pre className="mt-2 text-xs bg-slate-50 p-2 rounded text-slate-600 overflow-x-auto">
                        {JSON.stringify(c.value, null, 2)}
                      </pre>
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
