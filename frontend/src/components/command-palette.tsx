"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { cn } from "@/lib/utils";
import { User } from "@/types/user";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Sparkles,
  ClipboardList,
  BarChart3,
  Zap,
  MessageCircle,
  Users,
  Brain,
  Settings,
  CreditCard,
  Wallet,
  Award,
  Link2,
  Bell,
  User as UserIcon,
  Database,
  PlusCircle,
  Bot,
  TrendingUp,
  Layers,
  UserPlus,
  Search,
  type LucideIcon,
} from "lucide-react";

/* ─── Route definitions ─── */

interface CommandRoute {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string;
}

interface CommandGroup {
  heading: string;
  routes: CommandRoute[];
}

const profesorRoutes: CommandRoute[] = [
  { label: "Inicio", href: "/profesor", icon: LayoutDashboard, keywords: "dashboard home principal" },
  { label: "Mis Cursos", href: "/profesor/materias", icon: BookOpen, keywords: "materias clases asignaturas" },
  { label: "Examenes", href: "/profesor/examenes", icon: FileText, keywords: "pruebas tests evaluaciones" },
  { label: "Nuevo Examen", href: "/profesor/examenes/nuevo", icon: PlusCircle, keywords: "crear agregar test" },
  { label: "Generar con IA", href: "/profesor/generar", icon: Sparkles, keywords: "inteligencia artificial crear automatico" },
  { label: "Calificaciones", href: "/profesor/calificaciones", icon: ClipboardList, keywords: "notas grades puntuaciones" },
  { label: "Estadisticas", href: "/profesor/estadisticas", icon: BarChart3, keywords: "graficas reportes metricas analytics" },
  { label: "Quiz en Vivo", href: "/profesor/quiz-en-vivo", icon: Zap, keywords: "tiempo real live interactivo" },
  { label: "Mensajes", href: "/profesor/mensajes", icon: MessageCircle, keywords: "chat comunicacion enviar" },
  { label: "Alumnos", href: "/profesor/alumnos", icon: Users, keywords: "estudiantes lista roster" },
  { label: "Banco de Preguntas", href: "/profesor/banco-preguntas", icon: Database, keywords: "repositorio preguntas biblioteca" },
];

const alumnoRoutes: CommandRoute[] = [
  { label: "Inicio", href: "/alumno", icon: LayoutDashboard, keywords: "dashboard home principal" },
  { label: "Mis Examenes", href: "/alumno/examenes", icon: FileText, keywords: "pruebas tests evaluaciones" },
  { label: "Tutor IA", href: "/alumno/tutor", icon: Bot, keywords: "inteligencia artificial ayuda asistente" },
  { label: "Mi Progreso", href: "/alumno/progreso", icon: TrendingUp, keywords: "avance rendimiento analytics" },
  { label: "Flashcards", href: "/alumno/flashcards", icon: Layers, keywords: "tarjetas estudio repasar memorizar" },
  { label: "Unirme a Clase", href: "/alumno/unirse", icon: UserPlus, keywords: "codigo clase matricular inscribir" },
  { label: "Mensajes", href: "/alumno/mensajes", icon: MessageCircle, keywords: "chat comunicacion enviar" },
];

const adminRoutes: CommandRoute[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, keywords: "inicio home principal panel" },
  { label: "Usuarios", href: "/admin/usuarios", icon: Users, keywords: "personas cuentas gestionar" },
  { label: "Pagos", href: "/admin/pagos", icon: Wallet, keywords: "dinero transacciones facturacion" },
  { label: "Planes", href: "/admin/planes", icon: CreditCard, keywords: "suscripcion pricing precios" },
  { label: "Configuracion IA", href: "/admin/ia", icon: Brain, keywords: "inteligencia artificial modelos ajustes" },
  { label: "Certificados", href: "/admin/certificados", icon: Award, keywords: "diplomas credenciales" },
  { label: "Integraciones LTI", href: "/admin/lti", icon: Link2, keywords: "lms moodle canvas" },
  { label: "Configuracion", href: "/admin/config", icon: Settings, keywords: "ajustes sistema preferencias" },
  { label: "Logs", href: "/admin/logs", icon: ClipboardList, keywords: "registros actividad historial" },
];

const generalRoutes: CommandRoute[] = [
  { label: "Perfil", href: "/perfil", icon: UserIcon, keywords: "cuenta datos personales avatar" },
  { label: "Notificaciones", href: "/notificaciones", icon: Bell, keywords: "alertas avisos mensajes" },
  { label: "Suscripcion", href: "/suscripcion", icon: CreditCard, keywords: "plan pago facturacion" },
];

function getGroupsForRole(role: User["role"]): CommandGroup[] {
  const groups: CommandGroup[] = [];

  switch (role) {
    case "superadmin":
      groups.push({ heading: "Admin", routes: adminRoutes });
      groups.push({ heading: "Profesor", routes: profesorRoutes });
      groups.push({ heading: "Alumno", routes: alumnoRoutes });
      break;
    case "profesor":
      groups.push({ heading: "Profesor", routes: profesorRoutes });
      break;
    case "alumno":
      groups.push({ heading: "Alumno", routes: alumnoRoutes });
      break;
    case "padre":
      groups.push({ heading: "Padre", routes: [{ label: "Dashboard", href: "/padre", icon: LayoutDashboard }] });
      break;
  }

  const filteredGeneral = role === "superadmin"
    ? generalRoutes.filter((r) => r.href !== "/suscripcion")
    : generalRoutes;

  groups.push({ heading: "General", routes: filteredGeneral });

  return groups;
}

/* ─── Component ─── */

export function CommandPalette({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => getGroupsForRole(user.role), [user.role]);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command palette */}
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
        <Command
          className={cn(
            "pointer-events-auto w-full max-w-lg",
            "rounded-xl border border-border bg-popover text-popover-foreground",
            "shadow-2xl shadow-black/20",
            "flex flex-col overflow-hidden",
          )}
          loop
        >
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              ref={inputRef}
              placeholder="Buscar paginas, acciones..."
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[min(60vh,400px)] overflow-y-auto overscroll-contain px-2 py-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No se encontraron resultados.
            </Command.Empty>

            {groups.map((group) => (
              <Command.Group
                key={group.heading}
                heading={group.heading}
                className={cn(
                  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5",
                  "[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold",
                  "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider",
                  "[&_[cmdk-group-heading]]:text-muted-foreground",
                )}
              >
                {group.routes.map((route) => (
                  <Command.Item
                    key={route.href}
                    value={`${route.label} ${route.keywords ?? ""}`}
                    onSelect={() => handleSelect(route.href)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm",
                      "text-foreground/80 transition-colors",
                      "aria-selected:bg-primary/10 aria-selected:text-primary",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    )}
                  >
                    <route.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{route.label}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[140px] hidden sm:block">
                      {route.href}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer hints */}
          <div className="flex items-center gap-3 border-t border-border px-3 py-2">
            <span className="text-[11px] text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">&uarr;&darr;</kbd>
              {" "}navegar
            </span>
            <span className="text-[11px] text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd>
              {" "}ir
            </span>
            <span className="text-[11px] text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Esc</kbd>
              {" "}cerrar
            </span>
          </div>
        </Command>
      </div>
    </>
  );
}
