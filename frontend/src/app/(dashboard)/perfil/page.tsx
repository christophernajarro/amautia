"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/constants";
import { Save } from "lucide-react";

export default function PerfilPage() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-muted-foreground">{ROLE_LABELS[user.role]} &middot; {user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input defaultValue={user.first_name} />
            </div>
            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input defaultValue={user.last_name} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Correo electrónico</Label>
            <Input defaultValue={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input defaultValue={user.phone || ""} placeholder="999999999" />
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Save className="h-4 w-4 mr-1" /> Guardar Cambios
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
