"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User } from "@/types/user";
import {
  LayoutDashboard, BookOpen, FileText, Sparkles, GraduationCap,
  CreditCard, Settings, Brain, BarChart3, Bell, Wallet,
  ClipboardList, X, LogOut, Award, Link2, Zap, MessageCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  user: User;
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  divider?: boolean;
}

const adminLinks: NavItem[] = [
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

const profesorLinks: NavItem[] = [
  { href: "/profesor", label: "Inicio", icon: LayoutDashboard },
  { href: "/profesor/materias", label: "Mis Cursos", icon: BookOpen },
  { href: "/profesor/examenes", label: "Exámenes", icon: FileText },
  { href: "/profesor/generar", label: "Generar con IA", icon: Sparkles },
  { href: "/profesor/calificaciones", label: "Calificaciones", icon: ClipboardList },
  { href: "/profesor/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/profesor/quiz-en-vivo", label: "Quiz en Vivo", icon: Zap, divider: true },
  { href: "/profesor/mensajes", label: "Mensajes", icon: MessageCircle },
  { href: "/profesor/alumnos", label: "Alumnos", icon: Users },
];

const alumnoLinks: NavItem[] = [
  { href: "/alumno", label: "Inicio", icon: LayoutDashboard },
  { href: "/alumno/examenes", label: "Mis Exámenes", icon: FileText },
  { href: "/alumno/tutor", label: "Tutor IA", icon: Brain },
  { href: "/alumno/progreso", label: "Mi Progreso", icon: BarChart3 },
  { href: "/alumno/unirse", label: "Unirme a Clase", icon: GraduationCap, divider: true },
  { href: "/alumno/mensajes", label: "Mensajes", icon: MessageCircle },
];

const padreLinks: NavItem[] = [
  { href: "/padre", label: "Dashboard", icon: LayoutDashboard },
];

function getLinks(role: string): NavItem[] {
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

  const isActive = (href: string) => {
    const role = user.role === "superadmin" ? "admin" : user.role;
    return pathname === href || (href !== `/${role}` && href !== "/admin" && pathname.startsWith(href));
  };

  const content = (
    <div className="flex h-full flex-col bg-card text-card-foreground border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/15">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight">Amautia</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Nav links */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-0.5">
          {links.map((link) => (
            <div key={link.href}>
              {link.divider && (
                <div className="my-3 mx-3 border-t border-border" />
              )}
              <Link
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-colors",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <link.icon className={cn("h-[20px] w-[20px] shrink-0", isActive(link.href) ? "text-primary" : "")} />
                {link.label}
              </Link>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border px-3 py-3 shrink-0 space-y-2">
        {/* Quick links */}
        <div className="flex gap-1">
          {[
            { href: "/perfil", icon: Settings, label: "Perfil" },
            { href: "/notificaciones", icon: Bell, label: "Alertas" },
            ...(user.role !== "superadmin" ? [{ href: "/suscripcion", icon: CreditCard, label: "Plan" }] : []),
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* User row */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.first_name} {user.last_name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        {content}
      </div>

      {/* Mobile */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden shadow-2xl">
            {content}
          </div>
        </>
      )}
    </>
  );
}
