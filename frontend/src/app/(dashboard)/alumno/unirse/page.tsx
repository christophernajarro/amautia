"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";

export default function UnirsePage() {
  const [code, setCode] = useState("");

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Unirse a una Clase</h1>
        <p className="text-muted-foreground">Ingresa el código que te dio tu profesor</p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Código de clase</Label>
            <Input
              placeholder="Ej: ABC12345"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center text-lg tracking-wider"
              maxLength={8}
            />
          </div>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={code.length < 4}>
            Unirme
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
