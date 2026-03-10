// @ts-nocheck
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function PerfilPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl bg-indigo-100 text-indigo-600">
                {user.first_name[0]}{user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.first_name} {user.last_name}</h2>
              <Badge className="mt-1">{user.role}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nombre</Label>
              <Input defaultValue={user.first_name} disabled />
            </div>
            <div>
              <Label>Apellido</Label>
              <Input defaultValue={user.last_name} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue={user.email} disabled />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input defaultValue={user.phone || ""} placeholder="Sin teléfono" disabled />
            </div>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700" disabled>Guardar cambios (próximamente)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
