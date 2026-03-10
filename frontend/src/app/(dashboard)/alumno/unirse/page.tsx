
"use client";

import { useState } from "react";
import { useJoinSection } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle } from "lucide-react";

export default function UnirsePage() {
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState<{ section: string; subject: string } | null>(null);
  const [error, setError] = useState("");
  const joinSection = useJoinSection();

  const handleJoin = async () => {
    setError("");
    setSuccess(null);
    try {
      const result: any = await joinSection.mutateAsync(code.toUpperCase());
      setSuccess({ section: result.section, subject: result.subject });
      setCode("");
    } catch (e: any) {
      setError(e.message || "Error al unirse");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-indigo-600" />
          </div>
          <CardTitle className="text-xl">Unirme a una clase</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Ingresa el código de clase que te dio tu profesor</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Código de clase (ej: A1B2C3D4)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8} className="text-center text-lg tracking-widest font-mono" />
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
              <CheckCircle className="h-5 w-5" />
              <span>¡Te uniste a <strong>{success.subject}</strong> — {success.section}!</span>
            </div>
          )}
          <Button onClick={handleJoin} disabled={joinSection.isPending || code.length < 4}
            className="w-full bg-indigo-600 hover:bg-indigo-700">
            {joinSection.isPending ? "Uniéndome..." : "Unirme"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
