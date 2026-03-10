"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default function MateriasPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Materias</h1>
          <p className="text-muted-foreground">Organiza tus materias y secciones</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nueva Materia
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Materia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre de la materia</Label>
                <Input placeholder="Ej: Matemáticas" />
              </div>
              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Input placeholder="Breve descripción..." />
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                Crear Materia
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-dashed border-2 hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => setOpen(true)}>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Plus className="h-10 w-10 mb-3" />
            <p className="font-medium">Crear tu primera materia</p>
            <p className="text-sm">Organiza tus exámenes por materia</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
