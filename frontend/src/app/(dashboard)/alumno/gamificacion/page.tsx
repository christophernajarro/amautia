"use client";

import { useState } from "react";
import { useGamificationProfile, useMyBadges, useLeaderboard, usePointsHistory } from "@/lib/api-hooks";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Trophy, Star, Zap, Award, Lock, TrendingUp, Medal, AlertCircle } from "lucide-react";

export default function GamificacionPage() {
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading: loadingProfile } = useGamificationProfile();
  const { data: badges, isLoading: loadingBadges } = useMyBadges();
  const { data: history, isLoading: loadingHistory } = usePointsHistory();
  const [period, setPeriod] = useState("weekly");
  const { data: leaderboard, isLoading: loadingBoard } = useLeaderboard(undefined, period);

  const xpInLevel = profile ? (profile.xp % 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gamificación</h1>
        <p className="text-slate-500 dark:text-slate-400">Tu progreso, logros y ranking</p>
      </div>

      {/* Profile Stats */}
      {loadingProfile ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : profile ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                  <Star className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nivel</p>
                  <p className="text-2xl font-bold">{profile.level || 1}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{xpInLevel} XP</span>
                  <span>100 XP</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${xpInLevel}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                <Flame className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Racha actual</p>
                <p className="text-2xl font-bold">{profile.streak || 0} <span className="text-sm font-normal text-slate-400">dias</span></p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Puntos totales</p>
                <p className="text-2xl font-bold">{profile.total_points?.toLocaleString() || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                <Award className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Insignias</p>
                <p className="text-2xl font-bold">{badges?.filter((b: any) => b.earned)?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No se pudo cargar el perfil de gamificación</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Badges */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-500" />
              Insignias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBadges ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : badges && badges.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {badges.map((badge: any) => (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                      badge.earned
                        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-40"
                    }`}
                  >
                    <div className="text-3xl mb-1">{badge.icon || "🏅"}</div>
                    <p className="text-xs font-medium truncate w-full">{badge.name}</p>
                    {!badge.earned && <Lock className="h-3 w-3 text-slate-400 mt-1" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">No hay insignias disponibles aún</p>
            )}
          </CardContent>
        </Card>

        {/* Points History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Historial de puntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : history && history.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {history.map((entry: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div>
                      <p className="text-sm font-medium">{entry.reason || "Actividad"}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(entry.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">+{entry.points}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8">Sin historial aún</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Tabla de posiciones
            </CardTitle>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Semanal">
                  {{ weekly: "Semanal", monthly: "Mensual", all_time: "Histórico" }[period] || "Semanal"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="all_time">Histórico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loadingBoard ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                  <TableHead className="text-right">Nivel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.slice(0, 20).map((entry: any, idx: number) => {
                  const isMe = entry.user_id === user?.id;
                  return (
                    <TableRow key={entry.user_id || idx} className={isMe ? "bg-indigo-50 dark:bg-indigo-950/30 font-semibold" : ""}>
                      <TableCell>
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                      </TableCell>
                      <TableCell>
                        {entry.name || "Estudiante"}
                        {isMe && <Badge className="ml-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs">Tu</Badge>}
                      </TableCell>
                      <TableCell className="text-right">{entry.points?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{entry.level}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-slate-400 py-8">Sin datos de ranking aún</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
