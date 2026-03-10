// @ts-nocheck
"use client";

import { useAdminPayments } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, CreditCard } from "lucide-react";

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function PagosPage() {
  const { data: payments, isLoading } = useAdminPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
        <p className="text-slate-500">Verificación de pagos y comprobantes</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : payments?.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <CreditCard className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No hay pagos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.created_at).toLocaleDateString("es-PE")}</TableCell>
                    <TableCell className="font-medium">S/ {p.amount}</TableCell>
                    <TableCell className="capitalize">{p.method}</TableCell>
                    <TableCell className="text-slate-500">{p.reference_code || "—"}</TableCell>
                    <TableCell><Badge className={statusBadge[p.status]}>{p.status}</Badge></TableCell>
                    <TableCell>
                      {p.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="text-green-600"><CheckCircle className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-600"><XCircle className="h-4 w-4" /></Button>
                        </div>
                      )}
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
