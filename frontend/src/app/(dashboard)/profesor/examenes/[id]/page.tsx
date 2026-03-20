"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, API_URL } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreDistribution } from "@/components/charts/score-distribution";
import { ProgressRing } from "@/components/charts/progress-ring";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Upload, Zap, CheckCircle, Eye, Globe, FileSpreadsheet, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";

function BulkUploadZone({ examId, onUploaded }: { examId: string; onUploaded: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles(Array.from(newFiles));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);
    const token = getTokens().access;

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("files", files[i]);
      try {
        await apiFetch(`/profesor/exams/${examId}/student-exams`, {
          method: "POST",
          body: formData,
          token: token!,
        });
      } catch (err: any) {
        toast.error(`Error subiendo ${files[i].name}: ${err.message}`);
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setUploading(false);
    setFiles([]);
    setProgress(0);
    toast.success(`${files.length} exámenes subidos`);
    onUploaded();
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
      >
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold text-lg">Arrastra los exámenes aquí</p>
        <p className="text-sm text-muted-foreground mt-1">o haz clic para seleccionar archivos</p>
        <p className="text-xs text-muted-foreground mt-2">PDF, imágenes, Word o texto - Múltiples archivos</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.txt,.docx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{files.length} archivo{files.length > 1 ? 's' : ''} seleccionado{files.length > 1 ? 's' : ''}:</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{f.name}</span>
                <span className="text-muted-foreground shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="space-y-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{progress}% completado</p>
            </div>
          )}

          <Button onClick={handleUpload} disabled={uploading} className="w-full h-12 text-base">
            {uploading ? `Subiendo... ${progress}%` : `Subir ${files.length} examen${files.length > 1 ? 'es' : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ExamenPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [results, setResults] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [correcting, setCorrecting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const handleExport = async (format: "excel" | "pdf") => {
    setExporting(format);
    setErrorMsg("");
    try {
      const token = getTokens().access;
      const res = await fetch(`${API_URL}/profesor/exams/${id}/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error al exportar ${format.toUpperCase()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resultados.${format === "excel" ? "xlsx" : "pdf"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErrorMsg(e.message || `Error al exportar ${format.toUpperCase()}`);
    }
    setExporting(null);
  };

  const load = async () => {
    const token = getTokens().access;
    if (!token) return;
    try {
      const [r, s] = await Promise.all([
        apiFetch(`/profesor/exams/${id}/results`, { token }),
        apiFetch(`/profesor/exams/${id}/correction-status`, { token }),
      ]);
      setResults(r);
      setStatus(s);
    } catch (e: any) {
      setErrorMsg(e.message || "Error al cargar datos");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleCorrect = async () => {
    setCorrecting(true);
    setErrorMsg("");
    try {
      const token = getTokens().access;
      await apiFetch(`/profesor/exams/${id}/correct`, { method: "POST", token: token! });
      await load();
    } catch (e: any) {
      setErrorMsg(e.message || "Error al corregir");
    }
    setCorrecting(false);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setErrorMsg("");
    try {
      const token = getTokens().access;
      await apiFetch(`/profesor/exams/${id}/publish`, { method: "PATCH", token: token! });
      await load();
    } catch (e: any) {
      setErrorMsg(e.message || "Error al publicar");
    }
    setPublishing(false);
  };

  // Build distribution chart data
  const buildDistribution = (results: any) => {
    const ranges = [
      { range: "0-5", min: 0, max: 25 },
      { range: "6-10", min: 26, max: 50 },
      { range: "11-13", min: 51, max: 65 },
      { range: "14-16", min: 66, max: 80 },
      { range: "17-18", min: 81, max: 90 },
      { range: "19-20", min: 91, max: 100 },
    ];
    return ranges.map((r) => ({
      range: r.range,
      count: (results?.results || []).filter((s: any) => s.percentage != null && s.percentage >= r.min && s.percentage <= r.max).length,
    }));
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>
  );

  const stepDone = (n: number) => {
    if (n === 1) return (results?.stats?.total_students ?? 0) > 0;
    if (n === 2) return (results?.stats?.corrected ?? 0) > 0;
    if (n === 3) return results?.stats?.corrected > 0 && status?.pending === 0;
    return false;
  };
  const currentStep = stepDone(3) ? 3 : stepDone(2) ? 3 : stepDone(1) ? 2 : 1;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Exámenes", href: "/profesor/examenes" },
        { label: results?.title || "Examen" },
      ]} />
      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Subir exámenes" },
          { n: 2, label: "Corregir con IA" },
          { n: 3, label: "Revisar y publicar" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              stepDone(s.n) ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" : currentStep === s.n ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            }`}>
              {stepDone(s.n) ? <CheckCircle className="h-4 w-4" /> : s.n}
            </div>
            <span className={`text-xs font-medium ${currentStep === s.n ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>{s.label}</span>
            {i < 2 && <div className={`flex-1 h-0.5 ${stepDone(s.n) ? "bg-emerald-300 dark:bg-emerald-700" : "bg-slate-200 dark:bg-slate-700"}`} />}
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
          <button onClick={() => setErrorMsg("")} className="ml-auto text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400">&#x2715;</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/profesor/examenes">
            <Button variant="ghost" size="sm" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{results?.title || "Examen"}</h1>
            <Badge variant={results?.stats?.corrected > 0 ? "default" : "secondary"}>
              {results?.stats?.corrected}/{results?.stats?.total_students} corregidos
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(status?.pending ?? 0) > 0 && (
            <Button onClick={handleCorrect} disabled={correcting} className="bg-indigo-600 hover:bg-indigo-700">
              <Zap className="h-4 w-4 mr-2" />{correcting ? "Corrigiendo..." : `Corregir (${status?.pending})`}
            </Button>
          )}
          {results?.stats?.corrected > 0 && (
            <>
              <Button onClick={() => setShowPublishDialog(true)} disabled={publishing} variant="outline">
                <Globe className="h-4 w-4 mr-2" />{publishing ? "Publicando..." : "Publicar"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")} disabled={exporting === "excel"}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />{exporting === "excel" ? "Exportando..." : "Excel"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={exporting === "pdf"}>
                <FileText className="h-4 w-4 mr-1" />{exporting === "pdf" ? "Exportando..." : "PDF"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total alumnos", value: results?.stats?.total_students ?? 0 },
          { label: "Corregidos", value: results?.stats?.corrected ?? 0 },
          { label: "Promedio", value: `${Math.round(results?.stats?.average ?? 0)}%` },
          { label: "Máxima nota", value: `${Math.round(results?.stats?.max_score ?? 0)}%` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reference file preview */}
      {results?.reference_file_url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" /> Examen de referencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {results.reference_file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={`${API_URL.replace('/api/v1', '')}${results.reference_file_url}`} alt="Referencia" className="max-w-xs rounded-lg border" />
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted w-full">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{results.reference_file_url.split('/').pop()}</p>
                    <p className="text-sm text-muted-foreground">
                      {results.reference_file_type || 'Documento'}
                    </p>
                  </div>
                  <a href={`${API_URL.replace('/api/v1', '')}${results.reference_file_url}`} target="_blank" rel="noopener" className="ml-auto">
                    <Button variant="outline" size="sm">Ver archivo</Button>
                  </a>
                </div>
              )}
            </div>
            {results.questions_count > 0 && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-3 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> {results.questions_count} preguntas extraídas
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {results?.stats?.corrected > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Distribución de notas</CardTitle></CardHeader>
            <CardContent>
              <ScoreDistribution data={buildDistribution(results)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Promedio del grupo</CardTitle></CardHeader>
            <CardContent className="flex justify-center py-4">
              <ProgressRing
                value={results?.stats?.average ?? 0}
                color={results?.stats?.average >= 70 ? "#10b981" : results?.stats?.average >= 50 ? "#f59e0b" : "#ef4444"}
                label="Promedio general"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results table */}
      <Card>
        <CardHeader><CardTitle>Resultados por alumno</CardTitle></CardHeader>
        <CardContent>
          {(results?.results?.length ?? 0) === 0 ? (
            <BulkUploadZone examId={id} onUploaded={() => load()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Puntaje</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Retroalimentación</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.results.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.student_name}</TableCell>
                    <TableCell>
                      {r.adjusted_score != null && r.adjusted_score !== r.total_score ? (
                        <span className="flex items-center gap-1">
                          <span className="line-through text-slate-400 text-xs">{r.total_score ?? "—"}</span>
                          <span className="font-semibold text-indigo-600">{r.adjusted_score}</span>
                        </span>
                      ) : (
                        r.total_score ?? "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {r.percentage != null ? (
                        <span className={`font-semibold ${r.percentage >= 70 ? "text-emerald-600" : r.percentage >= 50 ? "text-amber-600" : "text-red-600"}`}>
                          {Math.round(r.percentage)}%
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "corrected" ? "default" : r.status === "error" ? "destructive" : "secondary"}>
                        {r.status === "corrected" ? "Corregido" : r.status === "error" ? "Error" : "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-slate-500">
                      {r.feedback || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {r.file_url && (
                          <a href={`${API_URL.replace('/api/v1', '')}${r.file_url}`} target="_blank" rel="noopener" title="Ver examen original">
                            <Button variant="ghost" size="sm" aria-label="Ver examen original">
                              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </a>
                        )}
                        <Link href={`/profesor/examenes/resultado/${r.id}?exam=${id}`}>
                          <Button variant="ghost" size="sm" aria-label="Ver detalle"><Eye className="h-4 w-4" /></Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bulk upload zone */}
      {(results?.results?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subir más exámenes</CardTitle>
          </CardHeader>
          <CardContent>
            <BulkUploadZone examId={id} onUploaded={() => load()} />
          </CardContent>
        </Card>
      )}

      {/* Publish confirmation dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar resultados</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Al publicar, los alumnos podrán ver sus calificaciones, retroalimentación y
              respuestas corregidas en su panel. Recibirán una notificación por email.
            </p>
            <p className="text-sm text-slate-500">
              {results?.stats?.corrected} de {results?.stats?.total_students} exámenes están corregidos.
              {(results?.stats?.total_students - results?.stats?.corrected) > 0 &&
                ` Los ${results?.stats?.total_students - results?.stats?.corrected} restantes no se publicarán hasta ser corregidos.`}
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Cancelar</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={async () => {
                setShowPublishDialog(false);
                await handlePublish();
              }}>
                <Globe className="h-4 w-4 mr-2" />Publicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
