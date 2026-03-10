import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Brain, FileText, BarChart3, Star, Upload, Sparkles, BookOpen, Users } from "lucide-react";

const features = [
  {
    icon: Upload, title: "Corrección automática con IA",
    desc: "Sube los exámenes escaneados o fotografiados. La IA los corrige en segundos con retroalimentación detallada por pregunta.",
    color: "indigo",
  },
  {
    icon: Sparkles, title: "Generación de exámenes",
    desc: "Describe el tema o pega un texto y la IA genera un examen completo con preguntas variadas, respuestas y rúbricas.",
    color: "violet",
  },
  {
    icon: Brain, title: "Tutor IA personalizado",
    desc: "Cada alumno tiene acceso a un tutor que responde preguntas, explica conceptos y genera ejercicios de práctica.",
    color: "emerald",
  },
  {
    icon: BarChart3, title: "Estadísticas y reportes",
    desc: "Dashboard en tiempo real con distribución de notas, tasa de aprobación, progreso individual y grupal.",
    color: "amber",
  },
  {
    icon: BookOpen, title: "Planes de estudio personalizados",
    desc: "La IA analiza los errores de cada alumno y genera un plan de estudio con temas prioritarios y ejercicios.",
    color: "rose",
  },
  {
    icon: Users, title: "Multi-sección y multi-materia",
    desc: "Gestiona todas tus materias y secciones desde un solo lugar. Comparte con código de clase.",
    color: "sky",
  },
];

const plans = [
  {
    name: "Básico", price: 29, color: "slate", popular: false,
    features: ["3 materias", "50 correcciones/mes", "Tutor IA básico", "Soporte email"],
  },
  {
    name: "Profesional", price: 59, color: "indigo", popular: true,
    features: ["Materias ilimitadas", "200 correcciones/mes", "Tutor IA avanzado", "Generación de exámenes", "Reportes PDF", "Soporte prioritario"],
  },
  {
    name: "Institucional", price: 149, color: "violet", popular: false,
    features: ["Todo lo de Profesional", "Correcciones ilimitadas", "Multi-profesor", "API acceso", "Soporte 24/7"],
  },
];

const testimonials = [
  { name: "Prof. María García", role: "Docente, Colegio San Marcos", text: "Reduje el tiempo de corrección de 4 horas a 10 minutos. La retroalimentación es increíblemente detallada.", stars: 5 },
  { name: "Prof. Carlos Rivera", role: "Matemáticas, Universidad Nacional", text: "Mis alumnos mejoraron un 30% en promedio usando el tutor IA. Es como tener un asistente privado para cada uno.", stars: 5 },
  { name: "Prof. Ana Flores", role: "Primaria, IE Tupac Amaru", text: "Generar exámenes variados ahora toma 2 minutos. Antes me llevaba toda la tarde.", stars: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur border-b z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg">Amautia</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#funciones" className="hover:text-indigo-600 transition-colors">Funciones</a>
            <a href="#precios" className="hover:text-indigo-600 transition-colors">Precios</a>
            <a href="#testimonios" className="hover:text-indigo-600 transition-colors">Testimonios</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Ingresar</Button></Link>
            <Link href="/register"><Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Prueba gratis</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
            🎓 Plataforma educativa con Inteligencia Artificial
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Corrige exámenes en{" "}
            <span className="text-indigo-600">segundos</span>{" "}
            con IA
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Amautia automatiza la corrección de exámenes, genera evaluaciones personalizadas
            y ofrece un tutor IA a cada alumno. Recupera tu tiempo y mejora los resultados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 h-14">
                <Sparkles className="h-5 w-5 mr-2" />Empieza gratis — sin tarjeta
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                Ver demo →
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">✓ 14 días gratis · ✓ Sin contrato · ✓ Cancela cuando quieras</p>
        </div>

        {/* Stats row */}
        <div className="max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-8 text-center">
          {[
            { value: "10x", label: "Más rápido que corregir a mano" },
            { value: "94%", label: "Precisión de la IA" },
            { value: "+500", label: "Profesores en Perú" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold text-indigo-600">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="funciones" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Todo lo que necesitas para enseñar mejor</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Una plataforma completa que combina IA con herramientas pedagógicas reales</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className={`h-12 w-12 rounded-xl bg-${f.color}-50 flex items-center justify-center mb-4`}>
                  <f.icon className={`h-6 w-6 text-${f.color}-600`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Cómo funciona</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "Sube el examen resuelto", desc: "Fotografía o escanea el examen modelo con las respuestas correctas." },
              { step: "02", title: "Sube los exámenes de alumnos", desc: "Carga los exámenes físicos o digitales. La IA los procesa en paralelo." },
              { step: "03", title: "Recibe resultados al instante", desc: "Nota por pregunta, retroalimentación personalizada y estadísticas del grupo." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Planes simples y transparentes</h2>
            <p className="text-lg text-slate-600">Paga con Yape, Plin o transferencia bancaria</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border-2 p-8 relative ${plan.popular ? "border-indigo-400 shadow-xl" : "border-slate-200"}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-600 text-white">Más popular</Badge>
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">S/ {plan.price}</span>
                  <span className="text-slate-500">/mes</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className={`w-full ${plan.popular ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                    variant={plan.popular ? "default" : "outline"}>
                    Empezar {plan.popular ? "ahora" : "gratis"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonios" className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Lo que dicen los profesores</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-slate-400 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">¿Listo para ahorrar horas cada semana?</h2>
          <p className="text-indigo-100 text-lg mb-8">Únete a cientos de profesores que ya usan Amautia</p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 text-lg px-10 h-14">
              Crear cuenta gratis →
            </Button>
          </Link>
          <p className="mt-4 text-indigo-200 text-sm">14 días gratis · Sin tarjeta · Cancela cuando quieras</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold">Amautia</span>
            <span className="text-slate-400 text-sm">· Plataforma educativa con IA</span>
          </div>
          <p className="text-slate-400 text-sm">© 2026 Amautia. Hecho en Perú 🇵🇪</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-indigo-600">Términos</a>
            <a href="#" className="hover:text-indigo-600">Privacidad</a>
            <a href="mailto:soporte@amautia.com" className="hover:text-indigo-600">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
