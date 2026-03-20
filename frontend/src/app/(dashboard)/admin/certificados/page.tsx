"use client";

import { useState } from "react";
import { useCertificateTemplates, useCreateCertificateTemplate, useIssueCertificate, useMyCertificates } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Plus, Send, Eye, Trash2, Loader2, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";

export default function AdminCertificadosPage() {
  const { data: templates, isLoading } = useCertificateTemplates();
  const createTemplate = useCreateCertificateTemplate();
  const issueCert = useIssueCertificate();

  const [createOpen, setCreateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueTemplateId, setIssueTemplateId] = useState("");
  const [issueStudentIds, setIssueStudentIds] = useState("");
  const [issueData, setIssueData] = useState("");

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) { toast.error("El nombre es obligatorio"); return; }
    try {
      await createTemplate.mutateAsync({
        name: templateName,
        description: templateDesc,
        html_template: templateHtml,
      });
      toast.success("Plantilla creada exitosamente");
      setCreateOpen(false);
      setTemplateName(""); setTemplateDesc(""); setTemplateHtml("");
    } catch (err: any) {
      toast.error(err.message || "Error al crear plantilla");
    }
  };

  const handleIssue = async () => {
    if (!issueTemplateId) { toast.error("Selecciona una plantilla"); return; }
    try {
      const studentIds = issueStudentIds.split(",").map((s) => s.trim()).filter(Boolean);
      if (studentIds.length === 0) { toast.error("Ingresa al menos un ID de alumno"); return; }
      let data = {};
      if (issueData.trim()) {
        try { data = JSON.parse(issueData); } catch { toast.error("Los datos deben ser JSON válido"); return; }
      }
      await issueCert.mutateAsync({ template_id: issueTemplateId, student_ids: studentIds, data });
      toast.success(`${studentIds.length} certificado(s) emitido(s)`);
      setIssueOpen(false);
      setIssueTemplateId(""); setIssueStudentIds(""); setIssueData("");
    } catch (err: any) {
      toast.error(err.message || "Error al emitir certificados");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestión de Certificados</h1>
          <p className="text-slate-500 dark:text-slate-400">Administra plantillas y emite certificados</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIssueOpen(true)} className="flex-1 sm:flex-initial">
            <Send className="h-4 w-4 mr-2" />Emitir certificados
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1 sm:flex-initial text-white" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Nueva plantilla
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templates?.length || 0}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Plantillas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Send className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templates?.reduce((sum: number, t: any) => sum + (t.issued_count || 0), 0) || 0}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Certificados emitidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
              <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templates?.filter((t: any) => t.is_active !== false).length || 0}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Activas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : templates && templates.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Plantillas de certificados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Emitidos</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tmpl: any) => (
                  <TableRow key={tmpl.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-500" />
                        {tmpl.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 max-w-xs truncate">{tmpl.description || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{tmpl.issued_count || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(tmpl.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewHtml(tmpl.html_template || "")}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setIssueTemplateId(tmpl.id); setIssueOpen(true); }}>
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
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
            <div className="h-20 w-20 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-6">
              <Award className="h-10 w-10 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sin plantillas de certificados</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">
              Crea plantillas HTML personalizadas para emitir certificados
            </p>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Crear primera plantilla
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {previewHtml && (
        <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml("")}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Vista previa</DialogTitle></DialogHeader>
            <div className="border rounded-lg p-6 min-h-[200px] bg-white" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            <DialogFooter><Button variant="outline" onClick={() => setPreviewHtml("")}>Cerrar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create template */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva plantilla de certificado</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nombre</label>
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Ej: Certificado de aprobación" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descripción</label>
              <Input value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} placeholder="Breve descripción" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Plantilla HTML</label>
              <Textarea value={templateHtml} onChange={(e) => setTemplateHtml(e.target.value)} placeholder="<div>...</div>" rows={8} className="font-mono text-xs" />
              <p className="text-xs text-slate-400 mt-1">Variables: {"{{student_name}}"}, {"{{date}}"}, {"{{course}}"}, {"{{score}}"}, {"{{verification_code}}"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleCreateTemplate} disabled={createTemplate.isPending} title={createTemplate.isPending ? "Procesando..." : undefined}>
              {createTemplate.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Crear plantilla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue certificates */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Emitir certificados</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Plantilla</label>
              <Select value={issueTemplateId} onValueChange={setIssueTemplateId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar plantilla" /></SelectTrigger>
                <SelectContent>
                  {(templates || []).map((t: any) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">IDs de alumnos (separados por comas)</label>
              <Textarea value={issueStudentIds} onChange={(e) => setIssueStudentIds(e.target.value)} placeholder="id1, id2, id3" rows={2} />
              <p className="text-xs text-slate-400 mt-1">Pegue los IDs de los alumnos, separados por comas</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Datos adicionales (JSON, opcional)</label>
              <Textarea value={issueData} onChange={(e) => setIssueData(e.target.value)} placeholder='{"course": "Matematicas I"}' rows={2} className="font-mono text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleIssue} disabled={issueCert.isPending} title={issueCert.isPending ? "Procesando..." : undefined}>
              {issueCert.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Emitiendo...</> : <><Send className="h-4 w-4 mr-2" />Emitir</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
