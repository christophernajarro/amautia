"use client";

import { useState } from "react";
import { useParentChildren, useParentDashboard, useLinkChild } from "@/lib/api-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, TrendingUp, BookOpen, FileText, ChevronRight, Loader2, GraduationCap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function PadreDashboardPage() {
  const { data: children, isLoading } = useParentChildren();
  const { data: dashboard } = useParentDashboard();
  const linkChild = useLinkChild();

  const [linkOpen, setLinkOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [relationship, setRelationship] = useState("padre");

  const handleLink = async () => {
    if (!studentEmail.trim()) { toast.error("Ingresa el correo del alumno"); return; }
    try {
      await linkChild.mutateAsync({ student_email: studentEmail, relationship });
      toast.success("Alumno vinculado exitosamente");
      setLinkOpen(false);
      setStudentEmail(""); setRelationship("padre");
    } catch (err: any) {
      toast.error(err.message || "Error al vincular alumno");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Portal de Padres</h1>
          <p className="text-slate-500 dark:text-slate-400">Seguimiento del progreso de tus hijos</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setLinkOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Vincular alumno
        </Button>
      </div>

      {/* Dashboard summary */}
      {dashboard && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard.total_children || children?.length || 0}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Hijos vinculados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard.average_score?.toFixed(1) || "-"}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Promedio general</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard.total_exams || 0}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Examenes totales</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Children cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : children && children.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child: any) => (
            <Link key={child.id} href={`/padre/hijo/${child.id}`}>
              <Card className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {child.first_name?.[0]}{child.last_name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">{child.first_name} {child.last_name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{child.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{child.average_score?.toFixed(1) || "-"}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Promedio</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-lg font-bold text-emerald-600">{child.total_exams || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Examenes</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{child.subjects_count || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Materias</p>
                    </div>
                  </div>

                  {child.recent_activity && (
                    <p className="text-xs text-slate-400 mt-3">Ultima actividad: {child.recent_activity}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mb-6">
              <GraduationCap className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Vincula a tu primer hijo</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-center">
              Ingresa el correo del alumno para seguir su progreso academico
            </p>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setLinkOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Vincular alumno
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Link child dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vincular alumno</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Correo del alumno</label>
              <Input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Relacion</label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="padre">Padre</SelectItem>
                  <SelectItem value="madre">Madre</SelectItem>
                  <SelectItem value="tutor">Tutor legal</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleLink} disabled={linkChild.isPending} title={linkChild.isPending ? "Procesando..." : undefined}>
              {linkChild.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Vinculando...</> : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
