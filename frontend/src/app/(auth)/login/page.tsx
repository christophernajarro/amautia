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
  superadmin: <Shield className="h-3.5 w-3.5" />,
  profesor: <BookOpen className="h-3.5 w-3.5" />,
  alumno: <User className="h-3.5 w-3.5" />,
};

const roleColors: Record<string, string> = {
  superadmin: "hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-300",
  profesor: "hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-300",
  alumno: "hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-300",
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
      setError(err.message || "Error al iniciar sesion");
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
      setError(err.message || "Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.12] bg-white/[0.05] backdrop-blur-xl p-10 shadow-2xl shadow-black/50">
      {/* Logo & Heading */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Amautia</span>
        </div>
        <h1 className="text-xl font-semibold text-white mb-1">Bienvenido de vuelta</h1>
        <p className="text-sm text-white/50">Ingresa a tu cuenta para continuar</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/60 text-xs font-medium uppercase tracking-wider">
            Correo electronico
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-11 h-12 bg-white/[0.06] border-white/[0.12] text-white text-base rounded-xl placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/25 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/60 text-xs font-medium uppercase tracking-wider">
            Contrasena
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-11 h-12 bg-white/[0.06] border-white/[0.12] text-white text-base rounded-xl placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/25 transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Ingresando...
            </>
          ) : (
            "Iniciar sesion"
          )}
        </Button>

        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-amber-400/80 hover:text-amber-300 transition-colors"
          >
            Olvidaste tu contrasena?
          </Link>
        </div>
      </form>

      {/* Quick access - dev only */}
      {TEST_USERS.length > 0 && (
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#09090b]/80 px-3 text-white/25 tracking-wider text-[10px]">
                Dev
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {TEST_USERS.map((testUser) => (
              <Button
                key={testUser.role}
                type="button"
                variant="outline"
                size="sm"
                className={`text-[10px] h-8 border-white/[0.10] bg-white/[0.03] text-white/50 transition-all duration-200 ${roleColors[testUser.role] || ""}`}
                onClick={() => handleTestUser(testUser.email, testUser.password)}
              >
                {roleIcons[testUser.role]}
                <span className="ml-1">{testUser.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Register link */}
      <div className="mt-6 text-center text-sm text-white/40">
        No tienes cuenta?{" "}
        <Link
          href="/registro"
          className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          Registrate
        </Link>
      </div>
    </div>
  );
}
