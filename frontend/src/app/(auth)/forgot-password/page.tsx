"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { KeyRound, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiFetch(
        "/auth/forgot-password",
        { method: "POST", body: JSON.stringify({ email }) }
      );
      setSent(true);
    } catch {
      setError("Error al enviar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
      <div className="text-center mb-6">
        <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="h-6 w-6 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          Recuperar Contraseña
        </h1>
        <p className="text-sm text-white/40 mt-2">
          Ingresa tu email y te enviaremos instrucciones
        </p>
      </div>

      {sent ? (
        <div className="text-center">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <p className="text-emerald-300 font-medium">Email enviado</p>
            </div>
            <p className="text-sm text-emerald-300/70 mt-1">
              Si el email existe en nuestro sistema, recibirás instrucciones
              para restablecer tu contraseña.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-amber-400/70 hover:text-amber-300 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-white/50 text-xs font-medium uppercase tracking-wider">
              Email
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/40 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold shadow-lg shadow-amber-500/20"
          >
            {loading ? "Enviando..." : "Enviar instrucciones"}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
