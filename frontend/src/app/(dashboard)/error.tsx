"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Algo salio mal</h2>
        <p className="text-muted-foreground mb-6">
          Ocurrio un error inesperado. Puedes intentar recargar la pagina.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Reintentar
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Ir al inicio
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-4">
            Codigo de error: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
