"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, Settings, Zap } from "lucide-react";

const providers = [
  { name: "Google Gemini", slug: "gemini", models: ["gemini-2.5-flash", "gemini-2.5-pro"], active: false, color: "text-blue-600", bg: "bg-blue-50" },
  { name: "OpenAI", slug: "openai", models: ["gpt-4o", "gpt-4o-mini"], active: false, color: "text-emerald-600", bg: "bg-emerald-50" },
  { name: "Anthropic Claude", slug: "claude", models: ["claude-sonnet-4-6", "claude-haiku-4-5"], active: false, color: "text-violet-600", bg: "bg-violet-50" },
];

export default function IAConfigPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración de IA</h1>
          <p className="text-muted-foreground">Gestiona los proveedores y modelos de inteligencia artificial</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-1" /> Agregar Proveedor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {providers.map((provider) => (
          <Card key={provider.slug}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${provider.bg} flex items-center justify-center`}>
                    <Brain className={`h-5 w-5 ${provider.color}`} />
                  </div>
                  <CardTitle className="text-base">{provider.name}</CardTitle>
                </div>
                <Badge variant={provider.active ? "default" : "secondary"}>
                  {provider.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">API Key</p>
                <p className="text-sm text-slate-600">No configurada</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Modelos disponibles</p>
                <div className="flex flex-wrap gap-1">
                  {provider.models.map((model) => (
                    <Badge key={model} variant="outline" className="text-xs">{model}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-3 w-3 mr-1" /> Configurar
                </Button>
                <Button variant="outline" size="sm">
                  <Zap className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
