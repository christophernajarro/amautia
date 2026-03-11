"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone, Shield, Save, CheckCircle } from "lucide-react";

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: "", color: "", width: "w-0" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Débil", color: "bg-red-500", width: "w-1/3" };
  if (score <= 3) return { label: "Media", color: "bg-amber-500", width: "w-2/3" };
  return { label: "Fuerte", color: "bg-emerald-500", width: "w-full" };
}

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", new_password: "", confirm: "" });

  const strength = getPasswordStrength(passwordForm.new_password);

  useEffect(() => {
    const token = getTokens().access;
    if (token) {
      apiFetch("/auth/me", { token }).then((data: any) => {
        setUser(data);
        setForm({ first_name: data.first_name || "", last_name: data.last_name || "", phone: data.phone || "" });
        setLoading(false);
      });
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = getTokens().access;
      await apiFetch("/auth/me", { method: "PUT", token: token!, body: JSON.stringify(form) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e.message);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Save success banner */}
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="h-4 w-4" />
          Cambios guardados correctamente
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-slate-500">Administra tu información personal</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user?.first_name} {user?.last_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge>{user?.role}</Badge>
                <span className="text-sm text-slate-500">{user?.email}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle>Información personal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <Label>Apellido</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <div className="flex items-center gap-2">
              <Input value={user?.email || ""} disabled className="bg-slate-50" />
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div>
            <Label>Teléfono</Label>
            <div className="flex items-center gap-2">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+51 999 999 999" />
              <Phone className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? "Guardando..." : (
              <><Save className="h-4 w-4 mr-2" />Guardar cambios</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Seguridad</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Contraseña actual</Label>
            <Input type="password" value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nueva contraseña</Label>
              <Input type="password" value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
            </div>
            <div>
              <Label>Confirmar</Label>
              <Input type="password" value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
            </div>
          </div>
          {/* Password strength indicator */}
          {passwordForm.new_password && (
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${strength.color} ${strength.width} rounded-full transition-all duration-300`} />
              </div>
              <p className={`text-xs ${strength.color === "bg-red-500" ? "text-red-600" : strength.color === "bg-amber-500" ? "text-amber-600" : "text-emerald-600"}`}>
                Seguridad: {strength.label}
              </p>
            </div>
          )}
          <Button variant="outline" disabled={!passwordForm.current || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm}>
            <Shield className="h-4 w-4 mr-2" />Cambiar contraseña
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
