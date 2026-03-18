"use client";

import { useState } from "react";
import { useLTIRegistrations, useCreateLTIRegistration } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, Plus, ExternalLink, Copy, Loader2, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";

export default function LTIPage() {
  const { data: registrations, isLoading } = useLTIRegistrations();
  const createReg = useCreateLTIRegistration();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [clientId, setClientId] = useState("");
  const [authUrl, setAuthUrl] = useState("");
  const [tokenUrl, setTokenUrl] = useState("");
  const [jwksUrl, setJwksUrl] = useState("");
  const [deploymentId, setDeploymentId] = useState("");

  const handleCreate = async () => {
    if (!name.trim() || !issuer.trim() || !clientId.trim()) {
      toast.error("Nombre, Issuer y Client ID son obligatorios");
      return;
    }
    try {
      await createReg.mutateAsync({
        name,
        issuer,
        client_id: clientId,
        auth_login_url: authUrl,
        auth_token_url: tokenUrl,
        jwks_url: jwksUrl,
        deployment_id: deploymentId || undefined,
      });
      toast.success("Registro LTI creado");
      setCreateOpen(false);
      setName(""); setIssuer(""); setClientId(""); setAuthUrl(""); setTokenUrl(""); setJwksUrl(""); setDeploymentId("");
    } catch (err: any) {
      toast.error(err.message || "Error al crear registro");
    }
  };

  const copyValue = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copiado`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Integraciones LTI</h1>
          <p className="text-slate-500 dark:text-slate-400">Conecta con plataformas LMS externas (Moodle, Canvas, etc.)</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Nuevo registro
        </Button>
      </div>

      {/* Platform info card */}
      <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-3">Datos de tu plataforma Amautia (para configurar en el LMS)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border">
              <div>
                <p className="text-xs text-slate-500">Tool URL</p>
                <p className="text-sm font-mono">{typeof window !== "undefined" ? `${window.location.origin}/api/lti/launch` : ""}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyValue(`${window.location.origin}/api/lti/launch`, "Tool URL")}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border">
              <div>
                <p className="text-xs text-slate-500">JWKS URL</p>
                <p className="text-sm font-mono">{typeof window !== "undefined" ? `${window.location.origin}/api/lti/jwks` : ""}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyValue(`${window.location.origin}/api/lti/jwks`, "JWKS URL")}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : registrations && registrations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Registros LTI</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Issuer</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg: any) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-indigo-500" />
                        {reg.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-slate-500 max-w-xs truncate">{reg.issuer}</TableCell>
                    <TableCell className="text-sm font-mono text-slate-500">{reg.client_id}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={reg.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                        {reg.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(reg.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-6">
              <Link2 className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sin integraciones LTI</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">
              Conecta Amautia con Moodle, Canvas u otro LMS compatible con LTI 1.3
            </p>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Crear registro
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo registro LTI 1.3</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nombre</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Moodle institucional" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Issuer (Platform ID)</label>
              <Input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="https://lms.example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Client ID</label>
              <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="abc123" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Auth Login URL</label>
              <Input value={authUrl} onChange={(e) => setAuthUrl(e.target.value)} placeholder="https://lms.example.com/mod/lti/auth.php" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Auth Token URL</label>
              <Input value={tokenUrl} onChange={(e) => setTokenUrl(e.target.value)} placeholder="https://lms.example.com/mod/lti/token.php" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">JWKS URL</label>
              <Input value={jwksUrl} onChange={(e) => setJwksUrl(e.target.value)} placeholder="https://lms.example.com/mod/lti/certs.php" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Deployment ID (opcional)</label>
              <Input value={deploymentId} onChange={(e) => setDeploymentId(e.target.value)} placeholder="1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCreate} disabled={createReg.isPending}>
              {createReg.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Crear registro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
