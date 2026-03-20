"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User } from "@/types/user";
import {
  LayoutDashboard, BookOpen, Users, FileText, Sparkles, GraduationCap,
  CreditCard, Settings, Brain, BarChart3, Bell, Wallet,
  ClipboardList, X, LogOut, Award, Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/pagos", label: "Pagos", icon: Wallet },
  { href: "/admin/planes", label: "Planes", icon: CreditCard },
  { href: "/admin/ia", label: "Configuración IA", icon: Brain },
  { href: "/admin/certificados", label: "Certificados", icon: Award },
  { href: "/admin/lti", label: "Integraciones LTI", icon: Link2 },
  { href: "/admin/config", label: "Configuración", icon: Settings },
  { href: "/admin/logs", label: "Logs", icon: ClipboardList },
];

const profesorLinks = [
  { href: "/profesor", label: "Inicio", icon: LayoutDashboard },
  { href: "/profesor/materias", label: "Mis Cursos", icon: BookOpen },
  { href: "/profesor/examenes", label: "Exámenes", icon: FileText },
  { href: "/profesor/generar", label: "Generar con IA", icon: Sparkles },
  { href: "/profesor/estadisticas", label: "Estadísticas", icon: BarChart3 },
] as const;

const alumnoLinks = [
  { href: "/alumno", label: "Inicio", icon: LayoutDashboard },
  { href: "/alumno/examenes", label: "Mis Exámenes", icon: FileText },
  { href: "/alumno/tutor", label: "Tutor IA", icon: Brain },
  { href: "/alumno/progreso", label: "Mi Progreso", icon: BarChart3 },
];

const padreLinks = [
  { href: "/padre", label: "Dashboard", icon: LayoutDashboard },
];

function getLinks(role: string) {
  switch (role) {
    case "superadmin": return adminLinks;
    case "profesor": return profesorLinks;
    case "alumno": return alumnoLinks;
    case "padre": return padreLinks;
    default: return [];
  }
}

export function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const links = getLinks(user.role);

  const content = (
    <div className="flex h-full flex-col bg-[#09090b] text-white">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/15">
          <GraduationCap className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">Amautia</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden text-white/40 hover:bg-white/[0.06] hover:text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-0.5">
          {links.map((link: any, i: number) => {
            const isActive = pathname === link.href || (link.href !== `/${user.role}` && link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3.5 rounded-lg px-3.5 py-3 text-[15px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/15"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/70 border border-transparent"
                )}
              >
                <link.icon className={cn("h-5 w-5", isActive ? "text-amber-400" : "")} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-3 space-y-0.5">
        <Link
          href="/notificaciones"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 border",
            pathname === "/notificaciones"
              ? "bg-amber-500/10 text-amber-300 border-amber-500/15"
              : "text-white/40 hover:bg-white/[0.04] hover:text-white/70 border-transparent"
          )}
        >
          <Bell className="h-4 w-4" />
          Notificaciones
        </Link>
        <Link
          href="/perfil"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 border",
            pathname === "/perfil"
              ? "bg-amber-500/10 text-amber-300 border-amber-500/15"
              : "text-white/40 hover:bg-white/[0.04] hover:text-white/70 border-transparent"
          )}
        >
          <Settings className="h-4 w-4" />
          Mi Perfil
        </Link>
        {user.role !== "superadmin" && (
          <Link
            href="/suscripcion"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 border",
              pathname === "/suscripcion"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/15"
                : "text-white/40 hover:bg-white/[0.04] hover:text-white/70 border-transparent"
            )}
          >
            <CreditCard className="h-4 w-4" />
            Suscripción
          </Link>
        )}

        {/* User info + logout */}
        <div className="mt-2 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-white/[0.06] flex items-center justify-center text-[11px] font-semibold text-white/50 uppercase">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white/70 truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-[11px] text-white/25 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-red-400/60 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-r border-white/[0.06]">
        {content}
      </div>

      {/* Mobile sidebar */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            {content}
          </div>
        </>
      )}
    </>
  );
}
