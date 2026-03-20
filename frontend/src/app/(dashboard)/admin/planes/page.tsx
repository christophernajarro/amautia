
"use client";

import { useState } from "react";
import { useAdminPlans, useTogglePlanStatus, useCreatePlan, useUpdatePlan } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Star, Power, Plus, Pencil } from "lucide-react";

const emptyForm = {
  name: "", slug: "", description: "", price_monthly: "",
  max_corrections_month: "", max_generations_month: "", max_students: "", max_subjects: "",
  has_tutor: false, tutor_level: "", has_rubrics: false, has_analytics: false,
  has_whatsapp_notifications: false, is_academy: false, max_professors: "1", display_order: "0",
};

export default function PlanesPage() {
  const { data: plans, isLoading } = useAdminPlans();
  const toggleStatus = useTogglePlanStatus();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  const [showDialog, setShowDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name || "",
      slug: plan.slug || "",
      description: plan.description || "",
      price_monthly: plan.price_monthly?.toString() || "",
      max_corrections_month: plan.max_corrections_month?.toString() || "",
      max_generations_month: plan.max_generations_month?.toString() || "",
      max_students: plan.max_students?.toString() || "",
      max_subjects: plan.max_subjects?.toString() || "",
      has_tutor: plan.has_tutor || false,
      tutor_level: plan.tutor_level || "",
      has_rubrics: plan.has_rubrics || false,
      has_analytics: plan.has_analytics || false,
      has_whatsapp_notifications: plan.has_whatsapp_notifications || false,
      is_academy: plan.is_academy || false,
      max_professors: plan.max_professors?.toString() || "1",
      display_order: plan.display_order?.toString() || "0",
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    const data: any = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      price_monthly: parseFloat(form.price_monthly) || 0,
      max_corrections_month: form.max_corrections_month ? parseInt(form.max_corrections_month) : null,
      max_generations_month: form.max_generations_month ? parseInt(form.max_generations_month) : null,
      max_students: form.max_students ? parseInt(form.max_students) : null,
      max_subjects: form.max_subjects ? parseInt(form.max_subjects) : null,
      has_tutor: form.has_tutor,
      tutor_level: form.tutor_level || null,
      has_rubrics: form.has_rubrics,
      has_analytics: form.has_analytics,
      has_whatsapp_notifications: form.has_whatsapp_notifications,
      is_academy: form.is_academy,
      max_professors: parseInt(form.max_professors) || 1,
      display_order: parseInt(form.display_order) || 0,
    };

    if (editingPlan) {
      await updatePlan.mutateAsync({ id: editingPlan.id, ...data });
    } else {
      await createPlan.mutateAsync(data);
    }
    setShowDialog(false);
    setEditingPlan(null);
    setForm(emptyForm);
  };

  const isPending = createPlan.isPending || updatePlan.isPending;

  if (isLoading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Planes</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestión de planes de suscripción</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />Nuevo plan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans?.map((plan: any) => (
          <Card key={plan.id} className={`relative ${plan.slug === "pro" ? "ring-2 ring-indigo-600" : ""}`}>
            {plan.slug === "pro" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-indigo-600"><Star className="h-3 w-3 mr-1" />Popular</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold">S/ {plan.price_monthly}</span>
                <span className="text-slate-500 dark:text-slate-400">/mes</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {plan.max_corrections_month ? `${plan.max_corrections_month} correcciones/mes` : "Correcciones ilimitadas"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {plan.max_students ? `${plan.max_students} alumnos` : "Alumnos ilimitados"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {plan.max_subjects ? `${plan.max_subjects} materias` : "Materias ilimitadas"}
                </li>
                {plan.has_tutor && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />Tutor IA ({plan.tutor_level})
                  </li>
                )}
                {plan.has_rubrics && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />Rubricas
                  </li>
                )}
                {plan.has_analytics && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />Estadisticas avanzadas
                  </li>
                )}
              </ul>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(plan)}
                >
                  <Pencil className="h-4 w-4 mr-1" />Editar
                </Button>
                <Button
                  variant={plan.is_active ? "outline" : "default"}
                  size="sm"
                  className={`flex-1 ${!plan.is_active ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                  onClick={() => toggleStatus.mutate({ plan_id: plan.id, is_active: !plan.is_active })}
                  disabled={toggleStatus.isPending}
                  title={toggleStatus.isPending ? "Procesando..." : undefined}
                >
                  <Power className="h-4 w-4 mr-1" />
                  {plan.is_active ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Create / Edit Plan Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? `Editar plan: ${editingPlan.name}` : "Nuevo plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input placeholder="ej: Pro" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input placeholder="ej: pro" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={!!editingPlan} title={editingPlan ? "El slug no se puede editar" : undefined} className={editingPlan ? "bg-slate-50" : ""} />
              </div>
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea placeholder="Descripción del plan..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio mensual (S/)</Label>
                <Input type="number" step="0.01" placeholder="29.90" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: e.target.value })} />
              </div>
              <div>
                <Label>Orden de display</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max correcciones/mes</Label>
                <Input type="number" placeholder="vacio = ilimitado" value={form.max_corrections_month} onChange={(e) => setForm({ ...form, max_corrections_month: e.target.value })} />
              </div>
              <div>
                <Label>Max generaciones/mes</Label>
                <Input type="number" placeholder="vacio = ilimitado" value={form.max_generations_month} onChange={(e) => setForm({ ...form, max_generations_month: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Max alumnos</Label>
                <Input type="number" placeholder="ilimitado" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: e.target.value })} />
              </div>
              <div>
                <Label>Max materias</Label>
                <Input type="number" placeholder="ilimitado" value={form.max_subjects} onChange={(e) => setForm({ ...form, max_subjects: e.target.value })} />
              </div>
              <div>
                <Label>Max profesores</Label>
                <Input type="number" value={form.max_professors} onChange={(e) => setForm({ ...form, max_professors: e.target.value })} />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Funcionalidades</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.has_tutor} onCheckedChange={(c) => setForm({ ...form, has_tutor: c })} />
                  <Label className="text-sm">Tutor IA</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.has_rubrics} onCheckedChange={(c) => setForm({ ...form, has_rubrics: c })} />
                  <Label className="text-sm">Rubricas</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.has_analytics} onCheckedChange={(c) => setForm({ ...form, has_analytics: c })} />
                  <Label className="text-sm">Estadisticas</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.has_whatsapp_notifications} onCheckedChange={(c) => setForm({ ...form, has_whatsapp_notifications: c })} />
                  <Label className="text-sm">WhatsApp</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_academy} onCheckedChange={(c) => setForm({ ...form, is_academy: c })} />
                  <Label className="text-sm">Plan academia</Label>
                </div>
              </div>
            </div>

            {form.has_tutor && (
              <div>
                <Label>Nivel de tutor</Label>
                <Input placeholder="ej: basic, advanced" value={form.tutor_level} onChange={(e) => setForm({ ...form, tutor_level: e.target.value })} />
              </div>
            )}

            <Button onClick={handleSubmit} disabled={isPending || !form.name.trim() || !form.slug.trim() || !form.price_monthly} title={isPending ? "Procesando..." : !form.name.trim() ? "Ingresa un nombre para el plan" : !form.slug.trim() ? "Ingresa un slug para el plan" : !form.price_monthly ? "Ingresa un precio mensual" : undefined} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {isPending ? "Guardando..." : editingPlan ? "Guardar cambios" : "Crear plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
