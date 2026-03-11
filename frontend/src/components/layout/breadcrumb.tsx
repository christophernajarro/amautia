"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  admin: "Administración", profesor: "Profesor", alumno: "Alumno",
  materias: "Materias", examenes: "Exámenes", alumnos: "Alumnos",
  estadisticas: "Estadísticas", generar: "Generar Examen", importar: "Importar",
  tutor: "Tutor IA", progreso: "Mi Progreso", calificaciones: "Calificaciones",
  unirse: "Unirme a Clase", perfil: "Mi Perfil", suscripcion: "Suscripción",
  notificaciones: "Notificaciones", usuarios: "Usuarios", pagos: "Pagos",
  planes: "Planes", ia: "Config IA", config: "Configuración", logs: "Logs",
  nuevo: "Nuevo", resultado: "Resultado",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
      <Link href={`/${segments[0]}`} className="hover:text-indigo-600 transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.slice(1).map((seg, i) => {
        const isLast = i === segments.length - 2;
        const href = "/" + segments.slice(0, i + 2).join("/");
        const label = routeLabels[seg] || seg;
        if (/^\d+$/.test(seg)) return null;
        return (
          <span key={seg + i} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-slate-300" />
            {isLast ? (
              <span className="font-medium text-slate-700">{label}</span>
            ) : (
              <Link href={href} className="hover:text-indigo-600 transition-colors">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
