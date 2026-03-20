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
import { User, Mail, Phone, Shield, Save, CheckCircle, AlertCircle } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [saveError, setSaveError] = useState("");
  const [passwordForm, setPasswordForm] = useState({ current: "", new_password: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const token = getTokens().access;
    if (token) {
      apiFetch("/auth/me", { token }).then((data: any) => {
        setUser(data);
        setForm({ first_name: data.first_name || "", last_name: data.last_name || "", phone: data.phone || "" });
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const token = getTokens().access;
      await apiFetch("/auth/me", { method: "PUT", token: token!, body: JSON.stringify(form) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e.message || "Error al guardar");
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
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-slate-500 dark:text-slate-400">Administra tu información personal</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <User className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user?.first_name} {user?.last_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge>{ROLE_LABELS[user?.role] || user?.role}</Badge>
                <span className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle>Información personal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Nombre</Label>
              <Input id="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Apellido</Label>
              <Input id="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Input id="email" value={user?.email || ""} disabled className="bg-slate-50 dark:bg-slate-800" />
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <div className="flex items-center gap-2">
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+51 999 999 999" />
              <Phone className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          {saveError && <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5"><AlertCircle className="h-4 w-4 shrink-0" />{saveError}</p>}
          <Button onClick={handleSave} disabled={saving} title={saving ? "Guardando..." : undefined} className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 text-white">
            {saved ? (
              <><CheckCircle className="h-4 w-4 mr-2" />Guardado</>
            ) : saving ? "Guardando..." : (
              <><Save className="h-4 w-4 mr-2" />Guardar cambios</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Seguridad</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current_password">Contraseña actual</Label>
            <Input id="current_password" type="password" value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="new_password">Nueva contraseña</Label>
              <Input id="new_password" type="password" value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirmar contraseña</Label>
              <Input id="confirm_password" type="password" value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
            </div>
          </div>
          {passwordError && <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5"><AlertCircle className="h-4 w-4 shrink-0" />{passwordError}</p>}
          {passwordChanged && <p className="text-sm text-emerald-600 flex items-center gap-1.5"><CheckCircle className="h-4 w-4 shrink-0" />Contraseña cambiada exitosamente</p>}
          <Button variant="outline"
            disabled={!passwordForm.current || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm || changingPassword}
            title={changingPassword ? "Procesando..." : !passwordForm.current ? "Ingresa contraseña actual" : !passwordForm.new_password ? "Ingresa nueva contraseña" : passwordForm.new_password !== passwordForm.confirm ? "Las contraseñas no coinciden" : undefined}
            className="transition-all duration-200"
            onClick={async () => {
              setChangingPassword(true);
              setPasswordError("");
              setPasswordChanged(false);
              try {
                const token = getTokens().access;
                await apiFetch("/auth/change-password", {
                  method: "PUT",
                  token: token!,
                  body: JSON.stringify({
                    current_password: passwordForm.current,
                    new_password: passwordForm.new_password,
                  }),
                });
                setPasswordChanged(true);
                setPasswordForm({ current: "", new_password: "", confirm: "" });
                setTimeout(() => setPasswordChanged(false), 3000);
              } catch (e: any) {
                setPasswordError(e.message || "Error al cambiar contraseña");
              }
              setChangingPassword(false);
            }}
          >
            <Shield className="h-4 w-4 mr-2" />{changingPassword ? "Cambiando..." : "Cambiar contraseña"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
