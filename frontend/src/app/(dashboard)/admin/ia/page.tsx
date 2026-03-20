
"use client";

import { useState } from "react";
import {
  useAdminProviders, useCreateProvider, useUpdateProvider, useDeleteProvider, useTestProvider,
  useAdminModels, useCreateModel, useUpdateModel, useDeleteModel, useSetDefaultModel,
} from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Cpu, Zap, Pencil, Trash2, FlaskConical, Star } from "lucide-react";

export default function IAConfigPage() {
  const { data: providers, isLoading: loadingProviders } = useAdminProviders();
  const { data: models, isLoading: loadingModels } = useAdminModels();
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const deleteProvider = useDeleteProvider();
  const testProvider = useTestProvider();
  const createModel = useCreateModel();
  const updateModel = useUpdateModel();
  const deleteModel = useDeleteModel();
  const setDefaultModel = useSetDefaultModel();

  // Provider dialogs
  const [showCreateProvider, setShowCreateProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [deletingProvider, setDeletingProvider] = useState<any>(null);
  const [providerForm, setProviderForm] = useState({ name: "", slug: "", api_key: "", is_active: true });
  const [testResult, setTestResult] = useState<{ id: string; status: string; message: string } | null>(null);

  // Default model dialog
  const [defaultModelTarget, setDefaultModelTarget] = useState<any>(null);

  // Model dialogs
  const [showCreateModel, setShowCreateModel] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [deletingModel, setDeletingModel] = useState<any>(null);
  const [modelForm, setModelForm] = useState({
    provider_id: "", name: "", model_id: "", supports_vision: false, supports_text: true,
    max_tokens: "", is_active: true,
  });

  const resetProviderForm = () => setProviderForm({ name: "", slug: "", api_key: "", is_active: true });
  const resetModelForm = () => setModelForm({ provider_id: "", name: "", model_id: "", supports_vision: false, supports_text: true, max_tokens: "", is_active: true });

  const handleCreateProvider = async () => {
    await createProvider.mutateAsync(providerForm);
    setShowCreateProvider(false);
    resetProviderForm();
  };

  const handleEditProvider = async () => {
    if (!editingProvider) return;
    const data: any = { id: editingProvider.id, name: providerForm.name, is_active: providerForm.is_active };
    if (providerForm.api_key) data.api_key = providerForm.api_key;
    await updateProvider.mutateAsync(data);
    setEditingProvider(null);
    resetProviderForm();
  };

  const handleDeleteProvider = async () => {
    if (!deletingProvider) return;
    await deleteProvider.mutateAsync(deletingProvider.id);
    setDeletingProvider(null);
  };

  const handleTestProvider = async (id: string) => {
    setTestResult(null);
    try {
      const result = await testProvider.mutateAsync(id);
      setTestResult({ id, ...result });
    } catch (e: any) {
      setTestResult({ id, status: "error", message: e?.message || "Error de conexion" });
    }
  };

  const handleCreateModel = async () => {
    const data: any = { ...modelForm, max_tokens: modelForm.max_tokens ? parseInt(modelForm.max_tokens) : null };
    await createModel.mutateAsync(data);
    setShowCreateModel(false);
    resetModelForm();
  };

  const handleEditModel = async () => {
    if (!editingModel) return;
    const data: any = {
      id: editingModel.id, name: modelForm.name, model_id: modelForm.model_id,
      supports_vision: modelForm.supports_vision, supports_text: modelForm.supports_text,
      max_tokens: modelForm.max_tokens ? parseInt(modelForm.max_tokens) : null,
      is_active: modelForm.is_active,
    };
    await updateModel.mutateAsync(data);
    setEditingModel(null);
    resetModelForm();
  };

  const handleDeleteModel = async () => {
    if (!deletingModel) return;
    await deleteModel.mutateAsync(deletingModel.id);
    setDeletingModel(null);
  };

  const getProviderName = (providerId: string) => {
    return providers?.find((p: any) => p.id === providerId)?.name || providerId;
  };

  return (
    <div className="space-y-8">
      {/* ── Providers Section ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configuracion de IA</h1>
            <p className="text-slate-500 dark:text-slate-400">Proveedores y modelos de inteligencia artificial</p>
          </div>
          <Button onClick={() => { resetProviderForm(); setShowCreateProvider(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />Agregar proveedor
          </Button>
        </div>

        {loadingProviders ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : providers?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Cpu className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">Sin proveedores configurados</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Agrega un proveedor de IA para empezar (Gemini, OpenAI, Claude)</p>
              <Button onClick={() => { resetProviderForm(); setShowCreateProvider(true); }} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />Agregar proveedor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers?.map((p: any) => (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{p.slug}</p>
                      </div>
                    </div>
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-400">Creado: {new Date(p.created_at).toLocaleDateString("es-PE")}</p>
                  {testResult?.id === p.id && testResult && (
                    <p className={`text-xs ${testResult.status === "ok" ? "text-emerald-600" : "text-red-600"}`}>
                      {testResult.message}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTestProvider(p.id)} disabled={testProvider.isPending} title={testProvider.isPending ? "Procesando..." : undefined}>
                      <FlaskConical className="h-3 w-3 mr-1" />Test
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setProviderForm({ name: p.name, slug: p.slug, api_key: "", is_active: p.is_active });
                      setEditingProvider(p);
                    }}>
                      <Pencil className="h-3 w-3 mr-1" />Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeletingProvider(p)}>
                      <Trash2 className="h-3 w-3 mr-1" />Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Models Section ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Modelos de IA</h2>
            <p className="text-slate-500 dark:text-slate-400">Modelos disponibles para correccion, generacion y tutor</p>
          </div>
          <Button onClick={() => {
            resetModelForm();
            if (providers?.length) setModelForm((f) => ({ ...f, provider_id: providers[0].id }));
            setShowCreateModel(true);
          }} className="bg-indigo-600 hover:bg-indigo-700" disabled={!providers?.length} title={!providers?.length ? "Agrega un proveedor primero" : undefined}>
            <Plus className="h-4 w-4 mr-2" />Agregar modelo
          </Button>
        </div>

        {loadingModels ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !models?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-sm text-slate-500 dark:text-slate-400">No hay modelos configurados. Agrega un proveedor primero.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Model ID</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Capacidades</TableHead>
                    <TableHead>Defaults</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{m.model_id}</TableCell>
                      <TableCell className="text-sm">{getProviderName(m.provider_id)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {m.supports_text && <Badge variant="secondary" className="text-xs">Texto</Badge>}
                          {m.supports_vision && <Badge variant="secondary" className="text-xs">Vision</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {m.is_default_correction && <Badge className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">Corrección</Badge>}
                          {m.is_default_generation && <Badge className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">Generación</Badge>}
                          {m.is_default_tutor && <Badge className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">Tutor</Badge>}
                          {m.is_default_vision && <Badge className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">Visión</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.is_active ? "default" : "secondary"}>
                          {m.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="Establecer como default" onClick={() => setDefaultModelTarget(m)}>
                            <Star className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setModelForm({
                              provider_id: m.provider_id, name: m.name, model_id: m.model_id,
                              supports_vision: m.supports_vision, supports_text: m.supports_text,
                              max_tokens: m.max_tokens?.toString() || "", is_active: m.is_active,
                            });
                            setEditingModel(m);
                          }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeletingModel(m)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Create Provider Dialog ── */}
      <Dialog open={showCreateProvider} onOpenChange={setShowCreateProvider}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar proveedor de IA</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input placeholder="ej: Google Gemini" value={providerForm.name} onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} /></div>
            <div><Label>Slug</Label><Input placeholder="ej: gemini, openai, anthropic" value={providerForm.slug} onChange={(e) => setProviderForm({ ...providerForm, slug: e.target.value })} /></div>
            <div><Label>API Key</Label><Input type="password" placeholder="sk-..." value={providerForm.api_key} onChange={(e) => setProviderForm({ ...providerForm, api_key: e.target.value })} /></div>
            <Button onClick={handleCreateProvider} disabled={createProvider.isPending || !providerForm.name.trim() || !providerForm.slug.trim() || !providerForm.api_key.trim()} title={createProvider.isPending ? "Procesando..." : !providerForm.name.trim() ? "Ingresa un nombre" : !providerForm.slug.trim() ? "Ingresa un slug" : !providerForm.api_key.trim() ? "Ingresa una API key" : undefined} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {createProvider.isPending ? "Creando..." : "Crear proveedor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Provider Dialog ── */}
      <Dialog open={!!editingProvider} onOpenChange={(open) => { if (!open) setEditingProvider(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar proveedor: {editingProvider?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={providerForm.name} onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} /></div>
            <div><Label>Slug (no editable)</Label><Input value={providerForm.slug} disabled className="bg-slate-50 dark:bg-slate-800" /></div>
            <div><Label>API Key (dejar vacio para no cambiar)</Label><Input type="password" placeholder="Nueva API key..." value={providerForm.api_key} onChange={(e) => setProviderForm({ ...providerForm, api_key: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={providerForm.is_active} onCheckedChange={(checked) => setProviderForm({ ...providerForm, is_active: checked })} />
              <Label>Activo</Label>
            </div>
            <Button onClick={handleEditProvider} disabled={updateProvider.isPending || !providerForm.name.trim()} title={updateProvider.isPending ? "Guardando..." : !providerForm.name.trim() ? "Ingresa un nombre" : undefined} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {updateProvider.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Provider Dialog ── */}
      <Dialog open={!!deletingProvider} onOpenChange={(open) => { if (!open) setDeletingProvider(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Eliminar proveedor</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Estas seguro de eliminar <strong>{deletingProvider?.name}</strong>? Esta accion eliminara tambien todos los modelos asociados.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeletingProvider(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteProvider} disabled={deleteProvider.isPending} title={deleteProvider.isPending ? "Procesando..." : undefined}>
              {deleteProvider.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create Model Dialog ── */}
      <Dialog open={showCreateModel} onOpenChange={setShowCreateModel}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar modelo de IA</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Proveedor</Label>
              <select className="w-full rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm dark:bg-slate-900" value={modelForm.provider_id} onChange={(e) => setModelForm({ ...modelForm, provider_id: e.target.value })}>
                {providers?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div><Label>Nombre</Label><Input placeholder="ej: GPT-4o" value={modelForm.name} onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })} /></div>
            <div><Label>Model ID</Label><Input placeholder="ej: gpt-4o, gemini-2.5-flash" value={modelForm.model_id} onChange={(e) => setModelForm({ ...modelForm, model_id: e.target.value })} /></div>
            <div><Label>Max tokens (opcional)</Label><Input type="number" placeholder="ej: 4096" value={modelForm.max_tokens} onChange={(e) => setModelForm({ ...modelForm, max_tokens: e.target.value })} /></div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={modelForm.supports_text} onCheckedChange={(c) => setModelForm({ ...modelForm, supports_text: c })} /><Label>Texto</Label></div>
              <div className="flex items-center gap-2"><Switch checked={modelForm.supports_vision} onCheckedChange={(c) => setModelForm({ ...modelForm, supports_vision: c })} /><Label>Vision</Label></div>
              <div className="flex items-center gap-2"><Switch checked={modelForm.is_active} onCheckedChange={(c) => setModelForm({ ...modelForm, is_active: c })} /><Label>Activo</Label></div>
            </div>
            <Button onClick={handleCreateModel} disabled={createModel.isPending || !modelForm.name.trim() || !modelForm.model_id.trim() || !modelForm.provider_id} title={createModel.isPending ? "Procesando..." : !modelForm.name.trim() ? "Ingresa un nombre" : !modelForm.model_id.trim() ? "Ingresa un Model ID" : !modelForm.provider_id ? "Selecciona un proveedor" : undefined} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {createModel.isPending ? "Creando..." : "Crear modelo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Model Dialog ── */}
      <Dialog open={!!editingModel} onOpenChange={(open) => { if (!open) setEditingModel(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar modelo: {editingModel?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={modelForm.name} onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })} /></div>
            <div><Label>Model ID</Label><Input value={modelForm.model_id} onChange={(e) => setModelForm({ ...modelForm, model_id: e.target.value })} /></div>
            <div><Label>Max tokens</Label><Input type="number" value={modelForm.max_tokens} onChange={(e) => setModelForm({ ...modelForm, max_tokens: e.target.value })} /></div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={modelForm.supports_text} onCheckedChange={(c) => setModelForm({ ...modelForm, supports_text: c })} /><Label>Texto</Label></div>
              <div className="flex items-center gap-2"><Switch checked={modelForm.supports_vision} onCheckedChange={(c) => setModelForm({ ...modelForm, supports_vision: c })} /><Label>Vision</Label></div>
              <div className="flex items-center gap-2"><Switch checked={modelForm.is_active} onCheckedChange={(c) => setModelForm({ ...modelForm, is_active: c })} /><Label>Activo</Label></div>
            </div>
            <Button onClick={handleEditModel} disabled={updateModel.isPending || !modelForm.name.trim() || !modelForm.model_id.trim()} title={updateModel.isPending ? "Guardando..." : !modelForm.name.trim() ? "Ingresa un nombre" : !modelForm.model_id.trim() ? "Ingresa un Model ID" : undefined} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {updateModel.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Model Dialog ── */}
      <Dialog open={!!deletingModel} onOpenChange={(open) => { if (!open) setDeletingModel(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Eliminar modelo</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Estas seguro de eliminar el modelo <strong>{deletingModel?.name}</strong> ({deletingModel?.model_id})?
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeletingModel(null)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteModel} disabled={deleteModel.isPending} title={deleteModel.isPending ? "Procesando..." : undefined}>
              {deleteModel.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Set Default Model Dialog ── */}
      <Dialog open={!!defaultModelTarget} onOpenChange={(open) => { if (!open) setDefaultModelTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Establecer como default</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Selecciona la tarea para la cual <strong>{defaultModelTarget?.name}</strong> sera el modelo por defecto:
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { task: "correction", label: "Corrección", color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50" },
              { task: "generation", label: "Generación", color: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50" },
              { task: "tutor", label: "Tutor", color: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50" },
              { task: "vision", label: "Visión", color: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50" },
            ].map(({ task, label, color }) => (
              <Button key={task} variant="outline" className={color}
                disabled={setDefaultModel.isPending}
                title={setDefaultModel.isPending ? "Procesando..." : undefined}
                onClick={() => {
                  setDefaultModel.mutate({ id: defaultModelTarget.id, task });
                  setDefaultModelTarget(null);
                }}>
                {label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
