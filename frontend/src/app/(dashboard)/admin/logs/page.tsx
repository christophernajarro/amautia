// @ts-nocheck
"use client";

import { useAdminLogs } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText } from "lucide-react";

export default function LogsPage() {
  const { data: logs, isLoading } = useAdminLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Logs de actividad</h1>
        <p className="text-slate-500">Registro de actividad del sistema</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : logs?.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <ScrollText className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No hay registros de actividad</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{new Date(log.created_at).toLocaleString("es-PE")}</TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell className="text-slate-500">{log.entity_type || "—"}</TableCell>
                    <TableCell className="text-xs text-slate-400 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
