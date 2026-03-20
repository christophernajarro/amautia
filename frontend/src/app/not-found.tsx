import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#06060a] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-8">
          <GraduationCap className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-7xl font-extrabold text-white mb-4">404</h1>
        <p className="text-xl text-white/50 mb-8">Esta pagina no existe o fue movida.</p>
        <Link href="/" className="inline-flex h-12 px-8 items-center rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
