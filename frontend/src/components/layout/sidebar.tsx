"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User } from "@/types/user";
import {
  LayoutDashboard, BookOpen, Users, FileText, Sparkles, GraduationCap,
  CreditCard, Settings, Brain, BarChart3, Bell, Shield, Wallet,
  ClipboardList, X, LogOut
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
  { href: "/admin/config", label: "Configuración", icon: Settings },
  { href: "/admin/logs", label: "Logs", icon: ClipboardList },
];

const profesorLinks = [
  { href: "/profesor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profesor/materias", label: "Materias", icon: BookOpen },
  { href: "/profesor/alumnos", label: "Alumnos", icon: Users },
  { href: "/profesor/examenes", label: "Exámenes", icon: FileText },
  { href: "/profesor/generar", label: "Generar Examen", icon: Sparkles },
  { href: "/profesor/estadisticas", label: "Estadísticas", icon: BarChart3 },
];

const alumnoLinks = [
  { href: "/alumno", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alumno/materias", label: "Materias", icon: BookOpen },
  { href: "/alumno/examenes", label: "Mis Exámenes", icon: FileText },
  { href: "/alumno/tutor", label: "Tutor IA", icon: Brain },
  { href: "/alumno/progreso", label: "Mi Progreso", icon: BarChart3 },
];

function getLinks(role: string) {
  switch (role) {
    case "superadmin": return adminLinks;
    case "profesor": return profesorLinks;
    case "alumno": return alumnoLinks;
    default: return [];
  }
}

export function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const links = getLinks(user.role);

  const content = (
    <div className="flex h-full flex-col bg-indigo-950 text-white">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-indigo-900">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold">Amautia</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden text-white hover:bg-indigo-900"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== `/${user.role}` && link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-800 text-white"
                    : "text-indigo-200 hover:bg-indigo-900 hover:text-white"
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-indigo-900 p-3 space-y-1">
        <Link
          href="/notificaciones"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-indigo-200 hover:bg-indigo-900 hover:text-white transition-colors"
        >
          <Bell className="h-5 w-5" />
          Notificaciones
        </Link>
        <Link
          href="/suscripcion"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-indigo-200 hover:bg-indigo-900 hover:text-white transition-colors"
        >
          <CreditCard className="h-5 w-5" />
          Suscripción
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-indigo-200 hover:bg-indigo-900 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        {content}
      </div>

      {/* Mobile sidebar */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            {content}
          </div>
        </>
      )}
    </>
  );
}
