"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Star, Zap, Crown, Upload, CreditCard, QrCode } from "lucide-react";

const plans = [
  {
    id: "basico", name: "Básico", price: 29, icon: Star, color: "indigo",
    features: ["Hasta 3 materias", "50 correcciones/mes", "Tutor IA básico", "Soporte por email"],
  },
  {
    id: "profesional", name: "Profesional", price: 59, icon: Zap, color: "violet", popular: true,
    features: ["Materias ilimitadas", "200 correcciones/mes", "Tutor IA avanzado", "Generación de exámenes", "Reportes PDF", "Soporte prioritario"],
  },
  {
    id: "institucional", name: "Institucional", price: 149, icon: Crown, color: "amber",
    features: ["Todo lo de Profesional", "Correcciones ilimitadas", "Multi-profesor", "API acceso", "Dashboard institucional", "Soporte 24/7"],
  },
];

export default function SuscripcionPage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = getTokens().access;
    if (token) {
      apiFetch("/auth/me", { token }).then((user: any) => {
        setCurrentPlan(user.plan || "free");
      });
    }
  }, []);

  const handlePayment = (planId: string) => {
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const token = getTokens().access;
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      formData.append("plan_id", selectedPlan);
      formData.append("amount", String(plans.find(p => p.id === selectedPlan)?.price || 0));
      formData.append("payment_method", "yape");
      await fetch("http://localhost:8000/api/v1/payments/upload-receipt", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setShowPayment(false);
      alert("¡Comprobante enviado! Tu suscripción será activada en breve.");
    } catch {
      alert("Error al subir comprobante");
    }
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Planes y Suscripción</h1>
        <p className="text-slate-500">Elige el plan que mejor se adapte a ti</p>
        {currentPlan && (
          <Badge className="mt-2" variant="secondary">Plan actual: {currentPlan}</Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? "border-indigo-300 shadow-lg scale-105" : ""}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-indigo-600">Más popular</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <div className={`h-12 w-12 rounded-xl bg-${plan.color}-50 flex items-center justify-center mx-auto mb-2`}>
                <plan.icon className={`h-6 w-6 text-${plan.color}-600`} />
              </div>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">S/ {plan.price}</span>
                <span className="text-slate-500 text-sm">/mes</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${plan.popular ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handlePayment(plan.id)}
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id ? "Plan actual" : "Elegir plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pagar con Yape o Plin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              {/* Real QR from backend */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`http://localhost:8000/api/v1/payments/qr/${selectedPlan}`}
                alt="QR Yape/Plin"
                className="h-40 w-40 mx-auto mb-3 rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="font-medium">Escanea el QR con Yape o Plin</p>
              <p className="text-2xl font-bold text-indigo-600 mt-2">
                S/ {plans.find(p => p.id === selectedPlan)?.price || 0}.00
              </p>
              <p className="text-sm text-slate-500 mt-1">A nombre de: Amautia SAC</p>
            </div>

            <div className="text-center text-sm text-slate-500">
              <p>También puedes transferir a:</p>
              <p className="font-mono mt-1">BCP: 191-12345678-0-12</p>
              <p className="font-mono">Interbank: 200-12345678-0-12</p>
            </div>

            <div>
              <Label>Sube tu comprobante de pago</Label>
              <div className="mt-2 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-2">Captura de pantalla o foto del voucher</p>
                <input type="file" accept="image/*,.pdf" onChange={handleUploadReceipt}
                  className="block mx-auto text-sm" disabled={uploading} />
              </div>
            </div>

            {uploading && (
              <p className="text-center text-sm text-indigo-600 animate-pulse">Subiendo comprobante...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
