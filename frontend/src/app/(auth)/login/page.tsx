"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { TEST_USERS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Shield, BookOpen, User, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

const roleIcons: Record<string, React.ReactNode> = {
  superadmin: <Shield className="h-4 w-4" />,
  profesor: <BookOpen className="h-4 w-4" />,
  alumno: <User className="h-4 w-4" />,
};

const roleColors: Record<string, string> = {
  superadmin: "hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300",
  profesor: "hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-300",
  alumno: "hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300",
};

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleTestUser = async (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setError("");
    setLoading(true);
    try {
      await login(testEmail, testPassword);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
      <div className="text-center mb-7">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Amautia</span>
        </div>
        <p className="text-sm text-white/40">Inicia sesión en tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-white/50 text-xs font-medium uppercase tracking-wider">
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/40 focus:ring-amber-500/20"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-white/50 text-xs font-medium uppercase tracking-wider">
            Contraseña
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/40 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold shadow-lg shadow-amber-500/20 transition-all duration-200"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Ingresando...
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>

        <div className="text-center">
          <Link href="/forgot-password" className="text-sm text-amber-400/70 hover:text-amber-300 transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </form>

      {TEST_USERS.length > 0 && (
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#09090b] px-3 text-white/20 tracking-wider">Acceso rápido</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {TEST_USERS.map((testUser) => (
              <Button
                key={testUser.role}
                type="button"
                variant="outline"
                size="sm"
                className={`text-xs border-white/[0.08] bg-white/[0.02] text-white/50 transition-all duration-200 ${roleColors[testUser.role] || ""}`}
                onClick={() => handleTestUser(testUser.email, testUser.password)}
              >
                {roleIcons[testUser.role]}
                <span className="ml-1.5">{testUser.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 text-center text-sm text-white/30">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-amber-400/80 hover:text-amber-300 font-medium transition-colors">
          Regístrate
        </Link>
      </div>
    </div>
  );
}
