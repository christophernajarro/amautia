
"use client";

import { useState } from "react";
import { useAdminUsers, useCreateUser, useToggleUserStatus, useDeleteUser, useUpdateUser } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreHorizontal, UserCheck, UserX, Trash2, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ROLE_LABELS } from "@/lib/constants";
import { toast } from "sonner";

const roleBadge: Record<string, string> = {
  superadmin: "bg-red-100 text-red-700",
  profesor: "bg-blue-100 text-blue-700",
  alumno: "bg-green-100 text-green-700",
};

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", role: "profesor", phone: "" });
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", role: "profesor", phone: "" });

  const { data: users, isLoading } = useAdminUsers({ search: search || undefined, role: roleFilter || undefined });
  const createUser = useCreateUser();
  const toggleStatus = useToggleUserStatus();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();

  const openEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({ first_name: user.first_name || "", last_name: user.last_name || "", role: user.role, phone: user.phone || "" });
  };

  const handleEdit = async () => {
    try {
      await updateUser.mutateAsync({ id: editingUser.id, ...editForm });
      setEditingUser(null);
      toast.success("Usuario actualizado correctamente");
    } catch (e: any) {
      toast.error(e.message || "Error al actualizar usuario");
    }
  };

  const handleCreate = async () => {
    try {
      await createUser.mutateAsync(form);
      setShowCreate(false);
      setForm({ email: "", password: "", first_name: "", last_name: "", role: "profesor", phone: "" });
      toast.success("Usuario creado correctamente");
    } catch (e: any) {
      toast.error(e.message || "Error al crear usuario");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Usuarios</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestión de usuarios de la plataforma</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Nuevo usuario</Button>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear usuario</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Nombre" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                <Input placeholder="Apellido" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <Select value={form.role} onValueChange={(v: string) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue>{{ superadmin: "Superadmin", profesor: "Profesor", alumno: "Alumno" }[form.role]}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                  <SelectItem value="profesor">Profesor</SelectItem>
                  <SelectItem value="alumno">Alumno</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Teléfono (opcional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Button onClick={handleCreate} disabled={createUser.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {createUser.isPending ? "Creando..." : "Crear usuario"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar por nombre o email..." className="pl-10" value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos los roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="profesor">Profesor</SelectItem>
                <SelectItem value="alumno">Alumno</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={roleBadge[user.role] || ""}>{ROLE_LABELS[user.role] || user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus.mutate({ id: user.id, is_active: !user.is_active })}>
                            {user.is_active ? <><UserX className="h-4 w-4 mr-2" />Desactivar</> : <><UserCheck className="h-4 w-4 mr-2" />Activar</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => setUserToDelete(user)}>
                            <Trash2 className="h-4 w-4 mr-2" />Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {users?.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-slate-500 dark:text-slate-400 py-8">No se encontraron usuarios</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{userToDelete?.first_name} {userToDelete?.last_name}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteUser.mutate(userToDelete.id); setUserToDelete(null); }} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Nombre" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
              <Input placeholder="Apellido" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
            </div>
            <Select value={editForm.role} onValueChange={(v: string) => setEditForm({ ...editForm, role: v })}>
              <SelectTrigger><SelectValue>{{ superadmin: "Superadmin", profesor: "Profesor", alumno: "Alumno" }[editForm.role]}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="profesor">Profesor</SelectItem>
                <SelectItem value="alumno">Alumno</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Teléfono (opcional)" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <Button onClick={handleEdit} disabled={updateUser.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {updateUser.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
