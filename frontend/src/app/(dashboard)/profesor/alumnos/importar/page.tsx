"use client";

import { useState, useEffect } from "react";
import { useProfesorSubjects } from "@/lib/api-hooks";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, AlertCircle, ArrowLeft, FileSpreadsheet, Download } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function ImportarAlumnosPage() {
  const { data: subjects } = useProfesorSubjects();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (selectedSubject) {
      const token = getTokens().access;
      apiFetch(`/profesor/subjects/${selectedSubject}/sections`, { token: token! })
        .then((d) => setSections(d as any[]));
    }
  }, [selectedSubject]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedSection) return;
    setUploading(true);
    setResult(null);
    try {
      const token = getTokens().access;
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      const data = await apiFetch<any>(`/profesor/sections/${selectedSection}/import-csv`, {
        method: "POST", token: token!, body: formData,
      });
      setResult(data);
      if (!data.error) {
        toast.success(`Importación completada: ${data.created ?? 0} alumnos creados`);
      }
    } catch (err) {
      setResult({ error: "Error al importar" });
    }
    setUploading(false);
  };

  const downloadTemplate = () => {
    const csv = "email,first_name,last_name,phone\nalumno1@ejemplo.com,Juan,Pérez,999111222\nalumno2@ejemplo.com,María,García,\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_alumnos.csv";
    a.click();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumb items={[
        { label: "Alumnos", href: "/profesor/alumnos" },
        { label: "Importar" },
      ]} />
      <div className="flex items-center gap-3">
        <Link href="/profesor/alumnos">
          <Button variant="ghost" size="sm" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Importar alumnos</h1>
          <p className="text-slate-500 dark:text-slate-400">Carga masiva desde CSV o Excel</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Configuración</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Materia</Label>
            <Select value={selectedSubject} onValueChange={(v: string) => setSelectedSubject(v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona una materia">{(subjects as any[])?.find((s: any) => s.id === selectedSubject)?.name}</SelectValue></SelectTrigger>
              <SelectContent>
                {(subjects as any[])?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {sections.length > 0 && (
            <div>
              <Label>Sección</Label>
              <Select value={selectedSection} onValueChange={(v: string) => setSelectedSection(v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona una sección">{sections.find((s: any) => s.id === selectedSection)?.name}</SelectValue></SelectTrigger>
                <SelectContent>
                  {sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subir archivo CSV</CardTitle>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />Descargar plantilla
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
            <FileSpreadsheet className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="font-medium mb-1">Arrastra tu archivo CSV aquí</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Columnas: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">email</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">first_name</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">last_name</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">phone</code>
            </p>
            <input type="file" accept=".csv,.xlsx" onChange={handleUpload}
              disabled={!selectedSection || uploading}
              title={uploading ? "Subiendo archivos..." : !selectedSection ? "Selecciona una sección primero" : undefined}
              className="block mx-auto text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>

          {uploading && (
            <div className="flex items-center justify-center gap-2 text-indigo-600 mt-4">
              <Upload className="h-5 w-5 animate-bounce" />
              <span>Importando alumnos...</span>
            </div>
          )}

          {result && !result.error && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Importación completada</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.created}</p>
                  <p className="text-xs text-slate-500">Creados</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.enrolled_existing}</p>
                  <p className="text-xs text-slate-500">Ya existían</p>
                </div>
                {result.errors > 0 && (
                <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.errors}</p>
                  <p className="text-xs text-slate-500">Errores</p>
                </div>
                )}
              </div>
              {result.error_details?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />Errores:
                  </p>
                  <ul className="text-xs text-slate-500 ml-5 mt-1">
                    {result.error_details.map((e: string, i: number) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
          {result?.error && (
            <div className="mt-4 flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />{result.error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
