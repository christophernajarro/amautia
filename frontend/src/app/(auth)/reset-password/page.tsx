"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle, ArrowLeft, AlertTriangle } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!token) {
      setError("Token no válido. Solicita un nuevo enlace de recuperación.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch(
        `/auth/reset-password?token=${encodeURIComponent(token)}&new_password=${encodeURIComponent(password)}`,
        { method: "POST" }
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Error al restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Enlace inválido
          </h1>
          <p className="text-sm text-white/40 mt-2">
            El enlace de recuperación no es válido o ha expirado.
          </p>
          <div className="mt-6 space-y-3">
            <Link href="/forgot-password">
              <Button className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold shadow-lg shadow-amber-500/20">
                Solicitar nuevo enlace
              </Button>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
      <div className="text-center mb-6">
        <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-6 w-6 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          Restablecer contraseña
        </h1>
        <p className="text-sm text-white/40 mt-2">
          Ingresa tu nueva contraseña
        </p>
      </div>

      {success ? (
        <div className="text-center">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <p className="text-emerald-300 font-medium">
                Contraseña actualizada
              </p>
            </div>
            <p className="text-sm text-emerald-300/70 mt-1">
              Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar
              sesión.
            </p>
          </div>
          <Link href="/login">
            <Button className="h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold shadow-lg shadow-amber-500/20">
              Ir a iniciar sesión
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-white/50 text-xs font-medium uppercase tracking-wider">
              Nueva contraseña
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-1.5 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/40 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <Label htmlFor="confirm-password" className="text-white/50 text-xs font-medium uppercase tracking-wider">
              Confirmar contraseña
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-1.5 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/40 focus:ring-amber-500/20"
            />
          </div>

          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold shadow-lg shadow-amber-500/20"
          >
            {loading ? "Restableciendo..." : "Restablecer contraseña"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/40 text-center">
          <p className="text-white/40">Cargando...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
