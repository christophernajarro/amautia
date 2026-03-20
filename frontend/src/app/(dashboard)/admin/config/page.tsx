
"use client";

import { useState } from "react";
import { useAdminConfig, useUpdateConfig } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, Pencil } from "lucide-react";

const CONFIG_LABELS: Record<string, string> = {
  yape_number: "Número de Yape",
  plin_number: "Número de Plin",
  grace_period_days: "Días de gracia",
  require_registration_approval: "Requiere aprobación de registro",
  default_grading_scale: "Escala de calificación por defecto",
};

export default function ConfigPage() {
  const { data: configs, isLoading } = useAdminConfig();
  const updateConfig = useUpdateConfig();
  const [editing, setEditing] = useState<any>(null);
  const [valueStr, setValueStr] = useState("");
  const [description, setDescription] = useState("");
  const [parseError, setParseError] = useState("");

  const openEdit = (c: any) => {
    setEditing(c);
    setValueStr(JSON.stringify(c.value, null, 2));
    setDescription(c.description || "");
    setParseError("");
  };

  const handleSave = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(valueStr);
    } catch {
      setParseError("JSON inválido");
      return;
    }
    await updateConfig.mutateAsync({ key: editing.key, value: parsed, description });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configuración</h1>
        <p className="text-slate-500 dark:text-slate-400">Configuración global del sistema</p>
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
                    <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mt-0.5">
                      <Settings className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{CONFIG_LABELS[c.key] || c.key}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{c.description || "Sin descripción"}</p>
                      <pre className="mt-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-slate-600 dark:text-slate-300 overflow-x-auto">
                        {JSON.stringify(c.value, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4 mr-1" />Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar: {editing?.key}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Valor (JSON)</Label>
              <Textarea rows={6} className="font-mono text-sm" value={valueStr} onChange={(e) => { setValueStr(e.target.value); setParseError(""); }} />
              {parseError && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{parseError}</p>}
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={updateConfig.isPending} title={updateConfig.isPending ? "Guardando..." : undefined} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {updateConfig.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
