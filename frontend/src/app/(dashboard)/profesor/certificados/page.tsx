"use client";

import { useState } from "react";
import { useCertificateTemplates, useCreateCertificateTemplate, useIssueCertificate } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Plus, FileText, Send, Eye, Loader2, AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";

export default function ProfesorCertificadosPage() {
  const { data: templates, isLoading } = useCertificateTemplates();
  const createTemplate = useCreateCertificateTemplate();
  const issueCert = useIssueCertificate();

  const [createOpen, setCreateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueTemplateId, setIssueTemplateId] = useState("");
  const [issueStudentIds, setIssueStudentIds] = useState("");
  const [issueData, setIssueData] = useState("");

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) { toast.error("El nombre es obligatorio"); return; }
    try {
      await createTemplate.mutateAsync({ name: templateName, html_template: templateHtml });
      toast.success("Plantilla creada");
      setCreateOpen(false);
      setTemplateName(""); setTemplateHtml("");
    } catch (err: any) {
      toast.error(err.message || "Error al crear plantilla");
    }
  };

  const handleIssue = async () => {
    if (!issueTemplateId) { toast.error("Selecciona una plantilla"); return; }
    try {
      const studentIds = issueStudentIds.split(",").map((s) => s.trim()).filter(Boolean);
      let data = {};
      if (issueData.trim()) {
        try { data = JSON.parse(issueData); } catch { toast.error("Los datos adicionales deben ser JSON valido"); return; }
      }
      await issueCert.mutateAsync({
        template_id: issueTemplateId,
        student_ids: studentIds,
        data,
      });
      toast.success(`Certificado(s) emitido(s) para ${studentIds.length} alumno(s)`);
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Certificados</h1>
          <p className="text-slate-500 dark:text-slate-400">Crea plantillas y emite certificados a tus alumnos</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIssueOpen(true)} className="flex-1 sm:flex-initial">
            <Send className="h-4 w-4 mr-2" />Emitir certificado
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1 sm:flex-initial" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Nueva plantilla
          </Button>
        </div>
      </div>

      {/* Templates */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tmpl: any) => (
            <Card key={tmpl.id} className="hover:shadow-md transition-shadow">
              <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600" />
              <CardContent className="pt-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{tmpl.name}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(tmpl.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {tmpl.issued_count != null && (
                  <Badge variant="secondary" className="text-xs">{tmpl.issued_count} emitidos</Badge>
                )}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setPreviewHtml(tmpl.html_template || ""); }}>
                    <Eye className="h-3 w-3 mr-1" />Vista previa
                  </Button>
                  <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => { setIssueTemplateId(tmpl.id); setIssueOpen(true); }}>
                    <Send className="h-3 w-3 mr-1" />Emitir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-6">
              <Award className="h-10 w-10 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Crea tu primera plantilla</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">
              Disena plantillas de certificados y emitelas para tus alumnos destacados
            </p>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Crear plantilla
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview dialog */}
      {previewHtml && (
        <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml("")}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Vista previa de plantilla</DialogTitle></DialogHeader>
            <div className="border rounded-lg p-4 min-h-[200px] bg-white dark:bg-slate-900" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewHtml("")}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create template dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva plantilla de certificado</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nombre de la plantilla</label>
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Ej: Certificado de excelencia" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Plantilla HTML</label>
              <Textarea
                value={templateHtml}
                onChange={(e) => setTemplateHtml(e.target.value)}
                placeholder="<div style='text-align:center'>&#10;  <h1>Certificado</h1>&#10;  <p>Se certifica que {{student_name}}...</p>&#10;</div>"
                rows={8}
                className="font-mono text-xs"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Variables: {"{{student_name}}"}, {"{{date}}"}, {"{{course}}"}, {"{{score}}"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateTemplate} disabled={createTemplate.isPending} title={createTemplate.isPending ? "Procesando..." : undefined}>
              {createTemplate.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creando...</> : "Crear plantilla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue certificate dialog */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Emitir certificado</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Plantilla</label>
              <Select value={issueTemplateId} onValueChange={setIssueTemplateId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar plantilla" /></SelectTrigger>
                <SelectContent>
                  {(templates || []).map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">IDs de alumnos (separados por comas)</label>
              <Textarea value={issueStudentIds} onChange={(e) => setIssueStudentIds(e.target.value)} placeholder="id1, id2, id3" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Datos adicionales (JSON, opcional)</label>
              <Textarea value={issueData} onChange={(e) => setIssueData(e.target.value)} placeholder='{"course": "Matematicas"}' rows={2} className="font-mono text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleIssue} disabled={issueCert.isPending} title={issueCert.isPending ? "Procesando..." : undefined}>
              {issueCert.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Emitiendo...</> : <><Send className="h-4 w-4 mr-2" />Emitir</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
