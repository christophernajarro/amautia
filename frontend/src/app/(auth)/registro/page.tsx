"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, GraduationCap, Loader2, AlertCircle, Users } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "profesor",
    class_code: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Amautia</span>
        </div>
        <p className="text-sm text-white/40">Crea tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => update("role", "profesor")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
              form.role === "profesor"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.12]"
            }`}
          >
            <BookOpen className="h-4 w-4" /> Profesor
          </button>
          <button
            type="button"
            onClick={() => update("role", "alumno")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
              form.role === "alumno"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.12]"
            }`}
          >
            <GraduationCap className="h-4 w-4" /> Alumno
          </button>
          <button
            type="button"
            onClick={() => update("role", "padre")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
              form.role === "padre"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.12]"
            }`}
          >
            <Users className="h-4 w-4" /> Padre
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name" className="text-white/50 text-xs font-medium uppercase tracking-wider">
              Nombre
            </Label>
            <Input
              id="first_name"
              name="first_name"
              autoComplete="given-name"
              value={form.first_name}
              onChange={(e) => update("first_name", e.target.value)}
              required
              className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/40 focus:ring-amber-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name" className="text-white/50 text-xs font-medium uppercase tracking-wider">
              Apellido
            </Label>
            <Input
              id="last_name"
              name="last_name"
              autoComplete="family-name"
              value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
              required
              className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/40 focus:ring-amber-500/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-white/50 text-xs font-medium uppercase tracking-wider">
            Correo electrónico
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
            className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/40 focus:ring-amber-500/20"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-white/50 text-xs font-medium uppercase tracking-wider">
            Contraseña
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/40 focus:ring-amber-500/20"
          />
        </div>

        {form.role === "alumno" && (
          <div className="space-y-1.5">
            <Label htmlFor="class_code" className="text-white/50 text-xs font-medium uppercase tracking-wider">
              Código de clase (opcional)
            </Label>
            <Input
              id="class_code"
              name="class_code"
              placeholder="Ej: ABC12345"
              value={form.class_code}
              onChange={(e) => update("class_code", e.target.value)}
              className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-amber-500/40 focus:ring-amber-500/20"
            />
          </div>
        )}

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
              Creando cuenta...
            </>
          ) : (
            "Crear cuenta"
          )}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-white/30">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-amber-400/80 hover:text-amber-300 font-medium transition-colors">
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}
