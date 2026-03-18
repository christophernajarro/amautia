"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, Brain, BarChart3, Star,
  Upload, Sparkles, BookOpen, Users, ArrowRight, GraduationCap,
  FileText, Scan, PenLine, Zap, ArrowUpRight,
} from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/landing/fade-in";
import { motion } from "framer-motion";

/* ─── Data ────────────────────────────────────────────────────────── */

const plans = [
  {
    name: "Básico",
    price: 29,
    popular: false,
    features: ["3 materias", "50 correcciones/mes", "Tutor IA básico", "Soporte email"],
  },
  {
    name: "Profesional",
    price: 59,
    popular: true,
    features: ["Materias ilimitadas", "200 correcciones/mes", "Tutor IA avanzado", "Generación de exámenes", "Reportes PDF", "Soporte prioritario"],
  },
  {
    name: "Institucional",
    price: 149,
    popular: false,
    features: ["Todo lo de Profesional", "Correcciones ilimitadas", "Multi-profesor", "API acceso", "Soporte 24/7"],
  },
];

const testimonials = [
  { name: "Prof. María García", role: "Colegio San Marcos, Lima", text: "Reduje el tiempo de corrección de 4 horas a 10 minutos. La retroalimentación es increíblemente detallada." },
  { name: "Prof. Carlos Rivera", role: "Universidad Nacional", text: "Mis alumnos mejoraron un 30% usando el tutor IA. Es como tener un asistente privado para cada uno." },
  { name: "Prof. Ana Flores", role: "IE Tupac Amaru", text: "Generar exámenes variados ahora toma 2 minutos. Antes me llevaba toda la tarde." },
  { name: "Prof. José Quispe", role: "Colegio Nacional, Ica", text: "Las estadísticas me ayudan a identificar qué temas necesitan refuerzo." },
  { name: "Prof. Rosa Chávez", role: "IE María Auxiliadora", text: "El tutor IA le da confianza a mis alumnos para preguntar sin miedo." },
  { name: "Prof. Luis Mendoza", role: "Colegio San José, Arequipa", text: "La corrección automática me devolvió las tardes con mi familia." },
];

/* ─── Exam Mockup Component ─── */
function ExamMockup() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Paper */}
      <div className="relative bg-white rounded-lg shadow-2xl shadow-black/40 p-6 border border-white/10 transform rotate-1 hover:rotate-0 transition-transform duration-700">
        {/* Scan line */}
        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scan-line" />
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-bold text-slate-800 tracking-wide uppercase">Examen de Historia</div>
            <div className="text-[8px] text-slate-400 mt-0.5">Sección A - Prof. García</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-emerald-600">18/20</div>
            <div className="text-[8px] text-slate-400">Nota final</div>
          </div>
        </div>
        {/* Questions */}
        {[
          { n: 1, score: "5/5", color: "emerald" },
          { n: 2, score: "4/5", color: "amber" },
          { n: 3, score: "5/5", color: "emerald" },
          { n: 4, score: "4/5", color: "amber" },
        ].map((q) => (
          <div key={q.n} className="flex items-center gap-3 py-2">
            <div className="h-5 w-5 rounded-full bg-slate-50 flex items-center justify-center text-[9px] font-bold text-slate-500">{q.n}</div>
            <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${q.color === "emerald" ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: q.score === "5/5" ? "100%" : "80%" }} />
            </div>
            <span className={`text-[9px] font-bold ${q.color === "emerald" ? "text-emerald-600" : "text-amber-600"}`}>{q.score}</span>
          </div>
        ))}
        {/* AI Feedback */}
        <div className="mt-3 p-2.5 bg-indigo-50 rounded-md border border-indigo-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-2.5 w-2.5 text-indigo-600" />
            <span className="text-[8px] font-bold text-indigo-700 uppercase tracking-wider">Retroalimentación IA</span>
          </div>
          <p className="text-[8px] text-indigo-600/80 leading-relaxed">Excelente dominio del tema. Revisar cronología del Virreinato en pregunta 2.</p>
        </div>
      </div>
      {/* Shadow card behind */}
      <div className="absolute inset-0 bg-white/5 rounded-lg transform -rotate-3 -z-10 border border-white/5" />
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ═══ DARK HERO ZONE ═══ */}
      <div className="relative bg-[#09090b] overflow-hidden grain">
        {/* Background mesh */}
        <div className="absolute inset-0 -z-[1]">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-indigo-600/8 via-transparent to-transparent animate-float-slow" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent animate-float-slower" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-indigo-500/3 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Navbar */}
        <nav className="relative z-50 border-b border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <GraduationCap className="h-4.5 w-4.5 text-[#09090b]" />
              </div>
              <span className="font-semibold text-white/90 tracking-tight">Amautia</span>
            </Link>
            <div className="hidden md:flex items-center gap-8 text-[13px] text-white/40">
              <a href="#funciones" className="hover:text-white/80 transition-colors duration-300">Funciones</a>
              <a href="#proceso" className="hover:text-white/80 transition-colors duration-300">Proceso</a>
              <a href="#precios" className="hover:text-white/80 transition-colors duration-300">Precios</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/5 text-[13px]">Ingresar</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-[#09090b] font-semibold text-[13px] shadow-lg shadow-amber-500/20">
                  Prueba gratis
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative z-10 pt-20 pb-28 px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <FadeIn>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.06] px-4 py-1.5 text-[13px] text-white/50 mb-8">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                  </span>
                  Plataforma educativa con IA
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-white leading-[1.05] tracking-tight mb-6">
                  Corrige exámenes
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 animate-gradient-shift">
                    en segundos
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="text-lg text-white/40 max-w-lg leading-relaxed mb-10">
                  Fotografía el examen, la IA lo corrige con retroalimentación detallada. Genera evaluaciones y ofrece un tutor personalizado a cada alumno.
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/register">
                    <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-[#09090b] font-semibold h-12 px-7 text-[15px] shadow-xl shadow-amber-500/15 w-full sm:w-auto">
                      Empieza gratis
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="#proceso">
                    <Button size="lg" variant="outline" className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 h-12 px-7 text-[15px] w-full sm:w-auto">
                      Ver cómo funciona
                    </Button>
                  </Link>
                </div>
              </FadeIn>

              <FadeIn delay={0.4}>
                <div className="mt-8 flex items-center gap-5 text-[13px] text-white/30">
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500/70" />14 días gratis</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500/70" />Sin tarjeta</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500/70" />Cancela cuando quieras</span>
                </div>
              </FadeIn>
            </div>

            {/* Right: Exam Mockup */}
            <FadeIn delay={0.4} direction="right">
              <ExamMockup />
            </FadeIn>
          </div>

          {/* Stats bar */}
          <FadeIn delay={0.5}>
            <div className="max-w-6xl mx-auto mt-20 pt-10 border-t border-white/[0.04]">
              <div className="grid grid-cols-3 gap-8">
                {[
                  { value: "10x", label: "más rápido que corregir a mano" },
                  { value: "94%", label: "precisión de corrección IA" },
                  { value: "+500", label: "profesores en Latinoamérica" },
                ].map((s) => (
                  <div key={s.value} className="text-center sm:text-left">
                    <div className="text-3xl sm:text-4xl font-bold text-white/90 tracking-tight">{s.value}</div>
                    <div className="text-[13px] text-white/25 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>
      </div>

      {/* ═══ LIGHT ZONE ═══ */}
      <div className="bg-white">

        {/* ── Features (Real Bento) ─── */}
        <section id="funciones" className="py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <div className="max-w-xl mb-16">
                <p className="text-[13px] font-semibold text-amber-600 uppercase tracking-wider mb-3">Funciones</p>
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                  Una plataforma,<br />todo el poder
                </h2>
              </div>
            </FadeIn>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(200px,auto)]">
              {/* Main feature - spans 2 cols, 2 rows */}
              <StaggerItem className="md:col-span-2 md:row-span-2">
                <div className="group relative h-full rounded-2xl bg-slate-900 p-8 sm:p-10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent" />
                  <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-amber-500/8 to-transparent rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="inline-flex p-3 rounded-xl bg-amber-500/10 mb-6">
                      <Scan className="h-6 w-6 text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Corrección automática con IA</h3>
                    <p className="text-white/40 max-w-md leading-relaxed mb-8">
                      Sube la foto del examen resuelto. La IA lo corrige pregunta por pregunta con retroalimentación detallada en segundos.
                    </p>
                    <div className="flex items-center gap-6 text-[13px] text-white/30">
                      <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400/60" />Resultados en 30 seg</span>
                      <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-400/60" />94% precisión</span>
                    </div>
                  </div>
                </div>
              </StaggerItem>

              {/* Feature 2 */}
              <StaggerItem>
                <div className="group relative h-full rounded-2xl bg-slate-50 p-7 overflow-hidden border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="inline-flex p-2.5 rounded-lg bg-violet-100 mb-4">
                    <Sparkles className="h-5 w-5 text-violet-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Generación de exámenes</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Describe el tema y la IA genera preguntas, respuestas y rúbricas.</p>
                </div>
              </StaggerItem>

              {/* Feature 3 */}
              <StaggerItem>
                <div className="group relative h-full rounded-2xl bg-slate-50 p-7 overflow-hidden border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="inline-flex p-2.5 rounded-lg bg-emerald-100 mb-4">
                    <Brain className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Tutor IA personalizado</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Cada alumno tiene un tutor que explica y genera ejercicios de práctica.</p>
                </div>
              </StaggerItem>

              {/* Feature 4 */}
              <StaggerItem>
                <div className="group relative h-full rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-7 overflow-hidden border border-amber-100/60 hover:border-amber-200 transition-colors">
                  <div className="inline-flex p-2.5 rounded-lg bg-amber-100 mb-4">
                    <BarChart3 className="h-5 w-5 text-amber-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Estadísticas en tiempo real</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Distribución de notas, aprobación y progreso individual y grupal.</p>
                </div>
              </StaggerItem>

              {/* Feature 5 */}
              <StaggerItem>
                <div className="group relative h-full rounded-2xl bg-slate-50 p-7 overflow-hidden border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="inline-flex p-2.5 rounded-lg bg-rose-100 mb-4">
                    <BookOpen className="h-5 w-5 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Planes de estudio IA</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Analiza errores y genera planes personalizados con temas prioritarios.</p>
                </div>
              </StaggerItem>

              {/* Feature 6 */}
              <StaggerItem>
                <div className="group relative h-full rounded-2xl bg-slate-50 p-7 overflow-hidden border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="inline-flex p-2.5 rounded-lg bg-sky-100 mb-4">
                    <Users className="h-5 w-5 text-sky-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-sección</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Gestiona materias y secciones desde un solo lugar con código de clase.</p>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* ── How it works ─── */}
        <section id="proceso" className="py-28 px-6 bg-slate-50/50">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-20">
                <p className="text-[13px] font-semibold text-amber-600 uppercase tracking-wider mb-3">Proceso</p>
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                  Tres pasos. Cero estrés.
                </h2>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-12 md:gap-6 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200" />

              {[
                { n: "01", icon: Upload, title: "Sube el examen", desc: "Fotografía o escanea el examen modelo con las respuestas correctas." },
                { n: "02", icon: PenLine, title: "La IA corrige", desc: "Sube los exámenes de alumnos. La IA procesa todo en paralelo." },
                { n: "03", icon: BarChart3, title: "Resultados al instante", desc: "Nota por pregunta, retroalimentación personalizada y estadísticas." },
              ].map((step, i) => (
                <FadeIn key={step.n} delay={i * 0.15}>
                  <div className="text-center relative">
                    <div className="relative inline-flex mb-6">
                      <div className="h-24 w-24 rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center justify-center">
                        <step.icon className="h-10 w-10 text-slate-700" />
                      </div>
                      <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-amber-500 text-[#09090b] flex items-center justify-center text-xs font-bold shadow-lg shadow-amber-500/30">
                        {step.n}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ─── */}
        <section id="precios" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <p className="text-[13px] font-semibold text-amber-600 uppercase tracking-wider mb-3">Precios</p>
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
                  Simple. Sin sorpresas.
                </h2>
                <p className="text-slate-500">Paga con Yape, Plin o transferencia bancaria</p>
              </div>
            </FadeIn>

            <StaggerContainer className="grid gap-6 md:grid-cols-3 items-stretch">
              {plans.map((plan) => (
                <StaggerItem key={plan.name}>
                  <div className={`relative h-full rounded-2xl p-8 transition-all duration-300 ${
                    plan.popular
                      ? "bg-slate-900 text-white ring-1 ring-white/10"
                      : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg"
                  }`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-6">
                        <span className="inline-block bg-amber-500 text-[#09090b] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-amber-500/30">
                          Popular
                        </span>
                      </div>
                    )}
                    <h3 className={`text-lg font-bold ${plan.popular ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                    <div className="mt-4 mb-6">
                      <span className={`text-5xl font-bold tracking-tight ${plan.popular ? "text-white" : "text-slate-900"}`}>S/{plan.price}</span>
                      <span className={`ml-1 text-sm ${plan.popular ? "text-white/40" : "text-slate-400"}`}>/mes</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f) => (
                        <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.popular ? "text-white/60" : "text-slate-600"}`}>
                          <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.popular ? "text-amber-400" : "text-emerald-500"}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/register" className="block">
                      <Button className={`w-full h-11 font-semibold ${
                        plan.popular
                          ? "bg-amber-500 hover:bg-amber-400 text-[#09090b] shadow-lg shadow-amber-500/20"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`} size="lg">
                        Empezar {plan.popular ? "ahora" : "gratis"}
                      </Button>
                    </Link>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ── Testimonials (Marquee) ─── */}
        <section className="py-28 px-6 bg-slate-50/50 overflow-hidden">
          <FadeIn>
            <div className="max-w-6xl mx-auto mb-12">
              <p className="text-[13px] font-semibold text-amber-600 uppercase tracking-wider mb-3">Testimonios</p>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                Lo que dicen los profesores
              </h2>
            </div>
          </FadeIn>

          {/* Infinite scroll marquee */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50/50 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50/50 to-transparent z-10" />
            <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused]">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="w-[340px] flex-shrink-0 rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center">
                      <span className="text-white font-semibold text-[10px]">
                        {t.name.split(" ").slice(1, 3).map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                      <p className="text-slate-400 text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ═══ DARK CTA ═══ */}
      <section className="relative bg-[#09090b] py-28 px-6 overflow-hidden grain">
        <div className="absolute inset-0 -z-[1]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-amber-500/5 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-5 leading-[1.1]">
              ¿Listo para recuperar<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">tus tardes?</span>
            </h2>
            <p className="text-white/30 text-lg mb-10 max-w-md mx-auto">
              Únete a cientos de profesores que ya usan Amautia.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-[#09090b] font-semibold h-13 px-10 text-lg shadow-xl shadow-amber-500/15">
                Crear cuenta gratis
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#09090b] border-t border-white/[0.04] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <GraduationCap className="h-3.5 w-3.5 text-[#09090b]" />
            </div>
            <span className="font-semibold text-white/60 text-sm">Amautia</span>
          </div>
          <p className="text-white/20 text-sm">© {new Date().getFullYear()} Amautia. Hecho en Perú.</p>
          <div className="flex gap-6 text-sm text-white/20">
            <a href="#" className="hover:text-white/50 transition-colors">Términos</a>
            <a href="#" className="hover:text-white/50 transition-colors">Privacidad</a>
            <a href="mailto:soporte@amautia.com" className="hover:text-white/50 transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
