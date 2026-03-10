"use client";

import { useState } from "react";
import { useJoinSection } from "@/lib/api-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, ArrowRight, Keyboard } from "lucide-react";
import Link from "next/link";

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
      setError(e.message || "Código inválido o sección inactiva");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8 space-y-6">
      {/* Main card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-center text-white">
          <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Unirme a una clase</h1>
          <p className="text-indigo-100 mt-2 text-sm">Tu profesor te dará un código de 8 caracteres</p>
        </div>

        <CardContent className="p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Código de clase</label>
            <Input
              placeholder="Ej: A1B2C3D4"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && code.length >= 4 && handleJoin()}
              maxLength={8}
              className="text-center text-2xl tracking-[0.3em] font-mono font-bold h-14 border-2 focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          {success ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-emerald-900">¡Te uniste exitosamente!</p>
              <p className="text-sm text-emerald-700 mt-1">
                <strong>{success.subject}</strong> — {success.section}
              </p>
              <Link href="/alumno/materias">
                <Button variant="link" className="text-emerald-700 mt-2">
                  Ver mis materias <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={joinSection.isPending || code.length < 4}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-base font-semibold"
            >
              {joinSection.isPending ? "Uniéndome..." : "Unirme a la clase"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Help section */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-slate-400" />
            ¿Cómo obtener el código?
          </h3>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span>Tu profesor crea una sección en Amautia</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span>Te comparte el código de clase (8 caracteres)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span>Ingresa el código aquí y ¡listo! Ya estás inscrito</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
