"use client";

import { useMyCertificates } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, Share2, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AlumnoCertificadosPage() {
  const { data: certificates, isLoading } = useMyCertificates();

  const handleDownload = (cert: any) => {
    if (cert.pdf_url) {
      window.open(cert.pdf_url, "_blank");
    } else {
      toast.info("El PDF no esta disponible aún");
    }
  };

  const handleShare = (cert: any) => {
    const url = `${window.location.origin}/certificados/verificar/${cert.verification_code}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Enlace de verificación copiado");
    }).catch(() => {
      toast.error("No se pudo copiar el enlace");
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mis Certificados</h1>
        <p className="text-slate-500 dark:text-slate-400">Certificados obtenidos por tu desempeño</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : certificates && certificates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert: any) => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600" />
              <CardContent className="pt-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                    <Award className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{cert.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{cert.subject_name || cert.course_name || ""}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Fecha</span>
                    <span className="font-medium">
                      {new Date(cert.issued_at || cert.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Código</span>
                    <Badge variant="secondary" className="font-mono text-xs">{cert.verification_code}</Badge>
                  </div>
                  {cert.score && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Calificación</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{cert.score}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(cert)}>
                    <Download className="h-4 w-4 mr-1" />PDF
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleShare(cert)}>
                    <Share2 className="h-4 w-4 mr-1" />Compartir
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
            <h3 className="text-lg font-semibold mb-2">Sin certificados aún</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm text-center">
              Cuando completes cursos o exámenes con excelencia, recibirás certificados aquí
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
