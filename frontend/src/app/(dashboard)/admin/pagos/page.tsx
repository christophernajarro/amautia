"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";

export default function PagosPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    const token = getTokens().access;
    if (token) {
      const data = await apiFetch("/admin/payments", { token });
      setPayments(data as any[]);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async () => {
    if (!selectedPayment) return;
    setApproving(true);
    const token = getTokens().access;
    await apiFetch(`/admin/payments/${selectedPayment.id}/approve`, { method: "PATCH", token: token! });
    setShowDetail(false);
    await load();
    setApproving(false);
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectReason.trim()) return;
    setRejecting(true);
    const token = getTokens().access;
    await apiFetch(`/admin/payments/${selectedPayment.id}/reject`, {
      method: "PATCH",
      token: token!,
      body: JSON.stringify({ reason: rejectReason }),
    });
    setShowDetail(false);
    setRejectReason("");
    await load();
    setRejecting(false);
  };

  const stats = {
    pending: payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
    total_amount: payments
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestionar Pagos</h1>
        <p className="text-slate-500 dark:text-slate-400">Verificar y aprobar pagos de suscripciones</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Aprobados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Rechazados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">S/ {stats.total_amount.toFixed(2)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ingresos</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pagos recibidos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno/Profesor</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} className={p.status === "pending" ? "bg-amber-50 dark:bg-amber-950/30" : ""}>
                    <TableCell className="font-medium text-sm">
                      {p.user_email || "Anónimo"}
                    </TableCell>
                    <TableCell className="text-sm">{p.plan_name || "—"}</TableCell>
                    <TableCell className="text-sm font-mono">S/ {p.amount?.toFixed(2) || "—"}</TableCell>
                    <TableCell className="text-sm capitalize">{p.method}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "approved" ? "default" : p.status === "rejected" ? "destructive" : "secondary"
                        }
                      >
                        {p.status === "approved" ? (
                          <><CheckCircle className="h-3 w-3 mr-1" />Aprobado</>
                        ) : p.status === "rejected" ? (
                          <><XCircle className="h-3 w-3 mr-1" />Rechazado</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" />Pendiente</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(p.created_at).toLocaleDateString("es-PE")}
                    </TableCell>
                    <TableCell>
                      {p.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(p);
                            setShowDetail(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verificar pago</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Usuario:</span>
                  <strong>{selectedPayment.user_email}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Plan:</span>
                  <strong>{selectedPayment.plan_name}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Monto:</span>
                  <strong>S/ {selectedPayment.amount?.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Método:</span>
                  <strong>{selectedPayment.method.toUpperCase()}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Fecha:</span>
                  <strong>{new Date(selectedPayment.created_at).toLocaleDateString("es-PE")}</strong>
                </div>
              </div>

              {selectedPayment.receipt_url && (
                <div>
                  <p className="text-sm font-medium mb-2">Comprobante:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPayment.receipt_url}
                    alt="Comprobante"
                    className="w-full max-h-48 object-cover rounded-lg border"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Razón de rechazo (si aplica):</label>
                <Textarea
                  placeholder="Por ej: El monto no coincide con el plan"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={approving}
                  title={approving ? "Procesando..." : undefined}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {approving ? "Aprobando..." : "Aprobar"}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={rejecting || !rejectReason.trim()}
                  title={rejecting ? "Procesando..." : !rejectReason.trim() ? "Ingresa un motivo de rechazo" : undefined}
                  variant="destructive"
                  className="flex-1"
                >
                  {rejecting ? "Rechazando..." : "Rechazar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
