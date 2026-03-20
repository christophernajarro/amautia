"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  ArrowLeft, Upload, Zap, CheckCircle, Eye, Globe, FileSpreadsheet,
  FileText, AlertCircle, Users, RefreshCw, Download, Image, File as FileIcon, X, UserPlus
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const baseUrl = () => API_URL.replace("/api/v1", "");

function fileUrl(path: string) {
  return `${baseUrl()}${path}`;
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

function isPdf(url: string) {
  return /\.pdf$/i.test(url);
}

// ─── File Preview Component ───

function FilePreview({ url, type, className = "" }: { url: string; type?: string; className?: string }) {
  const fullUrl = fileUrl(url);

  if (isImage(url) || (type && type.startsWith("image/"))) {
    return <img src={fullUrl} alt="Preview" className={`rounded-lg border max-w-full ${className}`} />;
  }

  if (isPdf(url) || type === "application/pdf") {
    return (
      <iframe
        src={fullUrl}
        className={`w-full rounded-lg border bg-white ${className}`}
        style={{ minHeight: 400 }}
        title="PDF Preview"
      />
    );
  }

  // Fallback: download link
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted w-full">
      <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{url.split("/").pop()}</p>
        <p className="text-sm text-muted-foreground">{type || "Documento"}</p>
      </div>
      <a href={fullUrl} target="_blank" rel="noopener">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" /> Descargar
        </Button>
      </a>
    </div>
  );
}

// ─── Bulk Upload Zone with Student Assignment ───

function BulkUploadZone({
  examId,
  enrolledStudents,
  onUploaded,
}: {
  examId: string;
  enrolledStudents?: any[];
  onUploaded: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileStudentMap, setFileStudentMap] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles);
    setFiles(arr);
    setFileStudentMap({});
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setFileStudentMap((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const assignStudent = (fileIdx: number, studentId: string) => {
    setFileStudentMap((prev) => ({
      ...prev,
      [fileIdx]: studentId || "",
    }));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);
    const token = getTokens().access;

    // Build student_ids array matching file order
    const studentIds = files.map((_, i) => fileStudentMap[i] || "");
    const hasAssignments = studentIds.some((s) => s);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    if (hasAssignments) {
      formData.append("student_ids", JSON.stringify(studentIds));
    }

    try {
      const result = await apiFetch<any>(`/profesor/exams/${examId}/student-exams`, {
        method: "POST",
        body: formData,
        token: token!,
      });

      const matched = result.student_exams?.filter((se: any) => se.student_id || se.matched_name).length || 0;
      if (matched > 0) {
        toast.success(`${result.uploaded} subidos, ${matched} asignados a alumnos`);
      } else {
        toast.success(`${result.uploaded} exámenes subidos`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }

    setUploading(false);
    setFiles([]);
    setFileStudentMap({});
    setProgress(0);
    onUploaded();
  };

  // Students not yet assigned to any file in this batch
  const availableStudents = enrolledStudents?.filter(
    (s) => !Object.values(fileStudentMap).includes(s.student_id)
  );

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
      >
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold text-lg">Arrastra los exámenes aquí</p>
        <p className="text-sm text-muted-foreground mt-1">o haz clic para seleccionar archivos</p>
        <p className="text-xs text-muted-foreground mt-2">
          PDF, imágenes, Word o texto - Múltiples archivos
        </p>
        {enrolledStudents && enrolledStudents.length > 0 && (
          <p className="text-xs text-indigo-500 mt-1">
            Los archivos se asignarán automáticamente por nombre (ej: juan_perez.pdf)
          </p>
        )}
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
        <div className="space-y-3">
          <p className="text-sm font-semibold">
            {files.length} archivo{files.length > 1 ? "s" : ""} seleccionado
            {files.length > 1 ? "s" : ""}:
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm p-3 rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1 min-w-0">{f.name}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
                {enrolledStudents && enrolledStudents.length > 0 && (
                  <select
                    className="text-xs border rounded px-2 py-1 bg-background max-w-[160px]"
                    value={fileStudentMap[i] || ""}
                    onChange={(e) => assignStudent(i, e.target.value)}
                  >
                    <option value="">Auto-detectar</option>
                    {enrolledStudents.map((s) => (
                      <option key={s.student_id} value={s.student_id}>
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => removeFile(i)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="space-y-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progress}% completado</p>
            </div>
          )}

          <Button onClick={handleUpload} disabled={uploading} className="w-full h-12 text-base">
            {uploading
              ? "Subiendo..."
              : `Subir ${files.length} examen${files.length > 1 ? "es" : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Per-Student Upload Button ───

function StudentUploadButton({
  examId,
  studentId,
  onUploaded,
}: {
  examId: string;
  studentId: string;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    const token = getTokens().access;
    const formData = new FormData();
    formData.append("files", file);
    formData.append("student_ids", JSON.stringify([studentId]));
    try {
      await apiFetch(`/profesor/exams/${examId}/student-exams`, {
        method: "POST",
        body: formData,
        token: token!,
      });
      toast.success("Examen subido");
      onUploaded();
    } catch (err: any) {
      toast.error(err.message);
    }
    setUploading(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Subir examen para este alumno"
      >
        {uploading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.txt,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </>
  );
}

// ─── Main Page ───

export default function ExamenPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [results, setResults] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [enrolled, setEnrolled] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [correcting, setCorrecting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "results">("students");
  const [previewDialog, setPreviewDialog] = useState<{ url: string; type?: string } | null>(null);

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

  const load = useCallback(async () => {
    const token = getTokens().access;
    if (!token) return;
    try {
      const [r, s, e] = await Promise.all([
        apiFetch(`/profesor/exams/${id}/results`, { token }),
        apiFetch(`/profesor/exams/${id}/correction-status`, { token }),
        apiFetch(`/profesor/exams/${id}/enrolled-students`, { token }).catch(() => null),
      ]);
      setResults(r);
      setStatus(s);
      setEnrolled(e);
    } catch (e: any) {
      setErrorMsg(e.message || "Error al cargar datos");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll during correction
  useEffect(() => {
    if (results?.exam_status !== "correcting") return;
    const interval = setInterval(() => load(), 3000);
    return () => clearInterval(interval);
  }, [results?.exam_status, load]);

  const handleCorrect = async () => {
    setCorrecting(true);
    setErrorMsg("");
    try {
      const token = getTokens().access;
      await apiFetch(`/profesor/exams/${id}/correct`, { method: "POST", token: token! });
      toast.success("Corrección iniciada");
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
      toast.success("Resultados publicados");
      await load();
    } catch (e: any) {
      setErrorMsg(e.message || "Error al publicar");
    }
    setPublishing(false);
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      const token = getTokens().access;
      await apiFetch(`/profesor/exams/${id}/process-reference`, { method: "POST", token: token! });
      toast.success("Referencia reprocesada");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Error al reprocesar");
    }
    setReprocessing(false);
  };

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
      count: (results?.results || []).filter(
        (s: any) => s.percentage != null && s.percentage >= r.min && s.percentage <= r.max
      ).length,
    }));
  };

  if (loading)
    return (
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

  const enrolledStudents = enrolled?.students || [];
  const isCorrecting = results?.exam_status === "correcting";

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Exámenes", href: "/profesor/examenes" },
          { label: results?.title || "Examen" },
        ]}
      />

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Subir exámenes" },
          { n: 2, label: "Corregir con IA" },
          { n: 3, label: "Revisar y publicar" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                stepDone(s.n)
                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                  : currentStep === s.n
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
              }`}
            >
              {stepDone(s.n) ? <CheckCircle className="h-4 w-4" /> : s.n}
            </div>
            <span
              className={`text-xs font-medium ${
                currentStep === s.n
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {s.label}
            </span>
            {i < 2 && (
              <div
                className={`flex-1 h-0.5 ${
                  stepDone(s.n) ? "bg-emerald-300 dark:bg-emerald-700" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
          <button
            onClick={() => setErrorMsg("")}
            className="ml-auto text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400"
          >
            &#x2715;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/profesor/examenes">
            <Button variant="ghost" size="sm" aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{results?.title || "Examen"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={results?.stats?.corrected > 0 ? "default" : "secondary"}>
                {results?.stats?.corrected}/{results?.stats?.total_students} corregidos
              </Badge>
              {isCorrecting && (
                <Badge variant="secondary" className="animate-pulse">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Corrigiendo...
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(status?.pending ?? 0) > 0 && !isCorrecting && (
            <Button
              onClick={handleCorrect}
              disabled={correcting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              {correcting ? "Iniciando..." : `Corregir todos (${status?.pending})`}
            </Button>
          )}
          {results?.stats?.corrected > 0 && (
            <>
              <Button
                onClick={() => setShowPublishDialog(true)}
                disabled={publishing}
                variant="outline"
              >
                <Globe className="h-4 w-4 mr-2" />
                {publishing ? "Publicando..." : "Publicar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("excel")}
                disabled={exporting === "excel"}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                {exporting === "excel" ? "..." : "Excel"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("pdf")}
                disabled={exporting === "pdf"}
              >
                <FileText className="h-4 w-4 mr-1" />
                {exporting === "pdf" ? "..." : "PDF"}
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" /> Examen de referencia
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReprocess}
                  disabled={reprocessing}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${reprocessing ? "animate-spin" : ""}`} />
                  {reprocessing ? "Procesando..." : "Reprocesar"}
                </Button>
                <a
                  href={fileUrl(results.reference_file_url)}
                  target="_blank"
                  rel="noopener"
                >
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" /> Descargar
                  </Button>
                </a>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FilePreview
              url={results.reference_file_url}
              type={results.reference_file_type}
              className="max-h-[500px] object-contain"
            />
            {results.questions_count > 0 && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
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
            <CardHeader>
              <CardTitle>Distribución de notas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreDistribution data={buildDistribution(results)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Promedio del grupo</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <ProgressRing
                value={results?.stats?.average ?? 0}
                color={
                  results?.stats?.average >= 70
                    ? "#10b981"
                    : results?.stats?.average >= 50
                      ? "#f59e0b"
                      : "#ef4444"
                }
                label="Promedio general"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "students"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4 inline mr-1.5" />
          Alumnos ({enrolledStudents.length})
        </button>
        <button
          onClick={() => setActiveTab("results")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "results"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle className="h-4 w-4 inline mr-1.5" />
          Resultados ({results?.results?.length ?? 0})
        </button>
      </div>

      {/* Students tab: enrolled students with upload per student */}
      {activeTab === "students" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Alumnos inscritos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {enrolledStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay alumnos inscritos en esta sección.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Examen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.map((s: any) => (
                    <TableRow key={s.student_id}>
                      <TableCell className="font-medium">
                        {s.first_name} {s.last_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                      <TableCell>
                        {s.has_exam ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs text-emerald-600">Subido</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin examen</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.status ? (
                          <Badge
                            variant={
                              s.status === "corrected"
                                ? "default"
                                : s.status === "error"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {s.status === "corrected"
                              ? "Corregido"
                              : s.status === "correcting"
                                ? "Corrigiendo"
                                : s.status === "error"
                                  ? "Error"
                                  : "Pendiente"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.percentage != null ? (
                          <span
                            className={`font-semibold ${
                              s.percentage >= 70
                                ? "text-emerald-600"
                                : s.percentage >= 50
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }`}
                          >
                            {Math.round(s.percentage)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {s.file_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPreviewDialog({ url: s.file_url })
                              }
                              title="Ver examen"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {!s.has_exam && (
                            <StudentUploadButton
                              examId={id}
                              studentId={s.student_id}
                              onUploaded={load}
                            />
                          )}
                          {s.student_exam_id && (
                            <Link href={`/profesor/examenes/resultado/${s.student_exam_id}?exam=${id}`}>
                              <Button variant="ghost" size="sm" title="Ver detalle">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Bulk upload zone */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Upload className="h-4 w-4" /> Subir exámenes en lote
              </h3>
              <BulkUploadZone
                examId={id}
                enrolledStudents={enrolledStudents}
                onUploaded={load}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results tab */}
      {activeTab === "results" && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados por alumno</CardTitle>
          </CardHeader>
          <CardContent>
            {(results?.results?.length ?? 0) === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No hay exámenes subidos aún.</p>
                <p className="text-sm mt-1">
                  Ve a la pestaña &quot;Alumnos&quot; para subir exámenes.
                </p>
              </div>
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
                        {r.adjusted_score != null &&
                        r.adjusted_score !== r.total_score ? (
                          <span className="flex items-center gap-1">
                            <span className="line-through text-slate-400 text-xs">
                              {r.total_score ?? "-"}
                            </span>
                            <span className="font-semibold text-indigo-600">
                              {r.adjusted_score}
                            </span>
                          </span>
                        ) : (
                          r.total_score ?? "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {r.percentage != null ? (
                          <span
                            className={`font-semibold ${
                              r.percentage >= 70
                                ? "text-emerald-600"
                                : r.percentage >= 50
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }`}
                          >
                            {Math.round(r.percentage)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "corrected"
                              ? "default"
                              : r.status === "error"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {r.status === "corrected"
                            ? "Corregido"
                            : r.status === "correcting"
                              ? "Corrigiendo"
                              : r.status === "error"
                                ? "Error"
                                : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-slate-500">
                        {r.feedback || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {r.file_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPreviewDialog({ url: r.file_url })
                              }
                              title="Ver examen original"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          )}
                          <Link href={`/profesor/examenes/resultado/${r.id}?exam=${id}`}>
                            <Button variant="ghost" size="sm" aria-label="Ver detalle">
                              <Eye className="h-4 w-4" />
                            </Button>
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
      )}

      {/* Upload zone always visible at bottom when no students tab */}
      {activeTab === "results" && (results?.results?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subir más exámenes</CardTitle>
          </CardHeader>
          <CardContent>
            <BulkUploadZone
              examId={id}
              enrolledStudents={enrolledStudents}
              onUploaded={load}
            />
          </CardContent>
        </Card>
      )}

      {/* File preview dialog */}
      <Dialog open={!!previewDialog} onOpenChange={() => setPreviewDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
          </DialogHeader>
          {previewDialog && (
            <FilePreview
              url={previewDialog.url}
              type={previewDialog.type}
              className="w-full"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Publish confirmation dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar resultados</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Al publicar, los alumnos podrán ver sus calificaciones, retroalimentación y respuestas
              corregidas en su panel. Recibirán una notificación por email.
            </p>
            <p className="text-sm text-slate-500">
              {results?.stats?.corrected} de {results?.stats?.total_students} exámenes están
              corregidos.
              {(results?.stats?.total_students - results?.stats?.corrected) > 0 &&
                ` Los ${results?.stats?.total_students - results?.stats?.corrected} restantes no se publicarán hasta ser corregidos.`}
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={async () => {
                  setShowPublishDialog(false);
                  await handlePublish();
                }}
              >
                <Globe className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
