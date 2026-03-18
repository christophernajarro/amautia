"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getTokens } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

export function UsageQuota() {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getTokens().access;
    if (token) {
      apiFetch("/profesor/usage", { token }).then((d) => {
        setUsage(d);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, []);

  if (loading || !usage) return null;
  if (!usage.has_subscription) return null;

  const correctionsPercent = usage.corrections.unlimited
    ? 100
    : Math.min(100, (usage.corrections.used / usage.corrections.limit) * 100);
  const generationsPercent = usage.generations.unlimited
    ? 100
    : Math.min(100, (usage.generations.used / usage.generations.limit) * 100);

  const correctionsAlertColor = correctionsPercent > 80 ? "bg-red-500" : correctionsPercent > 50 ? "bg-amber-500" : "bg-emerald-500";
  const generationsAlertColor = generationsPercent > 80 ? "bg-red-500" : generationsPercent > 50 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <Card className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Plan: {usage.plan}</CardTitle>
          {(correctionsPercent > 80 || generationsPercent > 80) && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertCircle className="h-3 w-3 mr-1" />
              Cuota alta
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Corrections */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-slate-300">Correcciones</span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {usage.corrections.used} / {usage.corrections.unlimited ? "∞" : usage.corrections.limit}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${correctionsAlertColor}`}
              style={{ width: `${correctionsPercent}%` }} />
          </div>
        </div>

        {/* Generations */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-slate-300">Generaciones</span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {usage.generations.used} / {usage.generations.unlimited ? "∞" : usage.generations.limit}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${generationsAlertColor}`}
              style={{ width: `${generationsPercent}%` }} />
          </div>
        </div>

        {/* Expires */}
        <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t">
          {usage.expires_at && (
            <>
              Vence:{" "}
              {new Date(usage.expires_at).toLocaleDateString("es-PE")}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
