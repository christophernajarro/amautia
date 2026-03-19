"use client";

import { Gift, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function ReferralBanner({ userEmail }: { userEmail: string }) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://amautia.com/registro?ref=${encodeURIComponent(userEmail)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("¡Enlace copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className="rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-800 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
        <Gift className="h-6 w-6 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-violet-900 dark:text-violet-200">Invita a un colega, ambos ganan</p>
        <p className="text-sm text-violet-700 dark:text-violet-300">Por cada profesor que se registre con tu enlace, ambos reciben 1 mes gratis.</p>
      </div>
      <Button onClick={copyLink} variant="outline" className="shrink-0 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300">
        {copied ? <><Check className="h-4 w-4 mr-2" />Copiado</> : <><Copy className="h-4 w-4 mr-2" />Copiar enlace</>}
      </Button>
    </div>
  );
}
