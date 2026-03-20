"use client";

import { useState } from "react";
import { usePublicPlans, useMySubscription } from "@/lib/api-hooks";
import { apiFetch, API_URL } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Star, Zap, Crown, Upload } from "lucide-react";
import { toast } from "sonner";

const planIcons: Record<number, typeof Star> = { 0: Star, 1: Zap, 2: Crown };
const planColors: Record<number, string> = { 0: "indigo", 1: "violet", 2: "amber" };

function buildFeatures(plan: any): string[] {
  const features: string[] = [];
  if (plan.max_subjects != null) features.push(plan.max_subjects === -1 ? "Materias ilimitadas" : `Hasta ${plan.max_subjects} materias`);
  if (plan.max_corrections_month != null) features.push(plan.max_corrections_month === -1 ? "Correcciones ilimitadas" : `${plan.max_corrections_month} correcciones/mes`);
  if (plan.has_tutor) features.push(plan.tutor_level === "advanced" ? "Tutor IA avanzado" : "Tutor IA básico");
  if (plan.has_rubrics) features.push("Rúbricas personalizadas");
  if (plan.has_analytics) features.push("Reportes y estadísticas");
  if (plan.has_whatsapp_notifications) features.push("Notificaciones WhatsApp");
  if (plan.is_academy) features.push("Dashboard institucional");
  if (plan.max_professors > 1) features.push(`Multi-profesor (${plan.max_professors})`);
  if (plan.description) features.push(plan.description);
  return features;
}

export default function SuscripcionPage() {
  const { data: plans, isLoading: loadingPlans } = usePublicPlans();
  const { data: subscription, isLoading: loadingSub } = useMySubscription();
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const currentPlanName = subscription?.plan_name || null;

  const handlePayment = (plan: any) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedPlan) return;
    setUploading(true);
    try {
      const token = getTokens().access;
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      formData.append("plan_id", selectedPlan.slug || selectedPlan.id);
      formData.append("amount", String(selectedPlan.price_monthly));
      formData.append("payment_method", "yape");
      await apiFetch("/payments/upload-receipt", {
        method: "POST", token: token!, body: formData,
      });
      setShowPayment(false);
      setUploadSuccess(true);
    } catch (err: any) {
      toast.error("Error al subir el comprobante. Intenta de nuevo.");
      setUploadSuccess(false);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Planes y Suscripción</h1>
        <p className="text-slate-500 dark:text-slate-400">Elige el plan que mejor se adapte a ti</p>
        {loadingSub ? (
          <Skeleton className="h-6 w-48 mx-auto mt-2" />
        ) : currentPlanName ? (
          <Badge className="mt-2" variant="secondary">Plan actual: {currentPlanName}</Badge>
        ) : (
          <Badge className="mt-2" variant="secondary">Plan actual: Gratuito</Badge>
        )}
        {subscription?.expires_at && (
          <p className="text-xs text-slate-400 mt-1">
            Vence: {new Date(subscription.expires_at).toLocaleDateString("es-PE")}
          </p>
        )}
      </div>

      {loadingPlans ? (
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {(plans || []).map((plan: any, idx: number) => {
            const Icon = planIcons[idx] || Star;
            const color = planColors[idx] || "indigo";
            const isPopular = idx === 1;
            const isCurrent = currentPlanName === plan.name;
            const features = buildFeatures(plan);

            return (
              <Card key={plan.id} className={`relative ${isPopular ? "border-indigo-300 shadow-lg scale-105" : ""}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-600 text-white">Más popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                    color === "indigo" ? "bg-indigo-50 dark:bg-indigo-950/30" : color === "violet" ? "bg-violet-50 dark:bg-violet-950/30" : "bg-amber-50 dark:bg-amber-950/30"
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      color === "indigo" ? "text-indigo-600" : color === "violet" ? "text-violet-600" : "text-amber-600"
                    }`} />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">S/ {plan.price_monthly}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">/mes</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {features.map((f: string) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${isPopular ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}`}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handlePayment(plan)}
                    disabled={isCurrent}
                    title={isCurrent ? "Ya estás en este plan" : undefined}
                  >
                    {isCurrent ? "Plan actual" : "Elegir plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pagar con Yape o Plin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 text-center">
              {/* Real QR from backend */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${API_URL}/payments/qr/${selectedPlan?.slug || selectedPlan?.id}`}
                alt="QR Yape/Plin"
                className="h-40 w-40 mx-auto mb-3 rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <p className="font-medium">Escanea el QR con Yape o Plin</p>
              <p className="text-2xl font-bold text-indigo-600 mt-2">
                S/ {selectedPlan?.price_monthly || 0}.00
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A nombre de: Amautia SAC</p>
            </div>

            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              <p>También puedes transferir a:</p>
              <p className="font-mono mt-1">BCP: 191-12345678-0-12</p>
              <p className="font-mono">Interbank: 200-12345678-0-12</p>
            </div>

            <div>
              <Label>Sube tu comprobante de pago</Label>
              <div className="mt-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                <Upload className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Captura de pantalla o foto del voucher</p>
                <input type="file" accept="image/*,.pdf" onChange={handleUploadReceipt}
                  className="block mx-auto text-sm" disabled={uploading} title={uploading ? "Subiendo archivos..." : undefined} />
              </div>
            </div>

            {uploading && (
              <p className="text-center text-sm text-indigo-600 animate-pulse">Subiendo comprobante...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success message */}
      {uploadSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setUploadSuccess(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm mx-4 text-center" onClick={e => e.stopPropagation()}>
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold">Comprobante enviado</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Tu suscripción será activada en breve una vez que revisemos tu pago.</p>
            <Button onClick={() => setUploadSuccess(false)} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Entendido</Button>
          </div>
        </div>
      )}
    </div>
  );
}
