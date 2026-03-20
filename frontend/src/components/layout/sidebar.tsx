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
  section?: string;
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
  { href: "/profesor/quiz-en-vivo", label: "Quiz en Vivo", icon: Zap, section: "Herramientas" },
  { href: "/profesor/mensajes", label: "Mensajes", icon: MessageCircle },
  { href: "/profesor/alumnos", label: "Alumnos", icon: Users },
];

const alumnoLinks: NavItem[] = [
  { href: "/alumno", label: "Inicio", icon: LayoutDashboard },
  { href: "/alumno/examenes", label: "Mis Exámenes", icon: FileText },
  { href: "/alumno/tutor", label: "Tutor IA", icon: Brain },
  { href: "/alumno/progreso", label: "Mi Progreso", icon: BarChart3 },
  { href: "/alumno/unirse", label: "Unirme a Clase", icon: GraduationCap, section: "Más" },
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

  const linkStyle = (href: string, role: string) => {
    const isActive = pathname === href || (href !== `/${role}` && href !== "/admin" && pathname.startsWith(href));
    return cn(
      "flex items-center gap-3.5 rounded-xl px-4 py-3 text-[16px] font-semibold transition-all duration-150",
      isActive
        ? "bg-amber-500/10 text-amber-300"
        : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
    );
  };

  const iconStyle = (href: string, role: string) => {
    const isActive = pathname === href || (href !== `/${role}` && href !== "/admin" && pathname.startsWith(href));
    return cn("h-5 w-5", isActive ? "text-amber-400" : "");
  };

  let lastSection = "";

  const content = (
    <div className="flex h-full flex-col bg-[#09090b] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/15">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="text-[17px] font-bold tracking-tight">Amautia</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden text-white/40 hover:bg-white/[0.06] hover:text-white"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {links.map((link) => {
            const showSection = link.section && link.section !== lastSection;
            if (link.section) lastSection = link.section;
            return (
              <div key={link.href}>
                {showSection && (
                  <div className="pt-5 pb-2 px-4">
                    <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-white/20">{link.section}</span>
                  </div>
                )}
                <Link href={link.href} onClick={onClose} className={linkStyle(link.href, user.role)}>
                  <link.icon className={iconStyle(link.href, user.role)} />
                  {link.label}
                </Link>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer — compact */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/perfil" onClick={onClose} className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors">
            <Settings className="h-4 w-4" /> Perfil
          </Link>
          <Link href="/notificaciones" onClick={onClose} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors">
            <Bell className="h-4 w-4" />
          </Link>
          {user.role !== "superadmin" && (
            <Link href="/suscripcion" onClick={onClose} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors">
              <CreditCard className="h-4 w-4" />
            </Link>
          )}
        </div>
        {/* User + logout */}
        <div className="flex items-center gap-3 px-3 py-2 border-t border-white/[0.06]">
          <div className="h-8 w-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[12px] font-bold text-white/50 uppercase shrink-0">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-white/70 truncate">{user.first_name} {user.last_name}</p>
          </div>
          <button onClick={logout} className="text-red-400/50 hover:text-red-300 transition-colors p-1" title="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-r border-white/[0.06]">
        {content}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden">
            {content}
          </div>
        </>
      )}
    </>
  );
}
