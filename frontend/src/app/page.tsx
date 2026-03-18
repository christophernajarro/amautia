"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Sparkles,
  FileText,
  Brain,
  BarChart3,
  Shield,
  Users,
  Star,
  ArrowRight,
  Check,
  ChevronRight,
  Zap,
  Clock,
  Upload,
  CheckCircle,
  Database,
  Scan,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

/* ─── Animation helpers ──────────────────────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}) {
  const offsets = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
  };
  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay, delayChildren: 0.1 },
        },
      }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── CountUp component ──────────────────────────────────────────── */

function CountUp({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = value / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [started, value, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Data ────────────────────────────────────────────────────────── */

const testimonials = [
  { name: "Maria Garcia Lopez", role: "Profesora de Historia", institution: "Colegio San Martin, Lima", text: "Reduje el tiempo de correccion de 4 horas a 10 minutos. La retroalimentacion que genera la IA es increiblemente detallada y precisa." },
  { name: "Carlos Rivera Mendez", role: "Coordinador Academico", institution: "Instituto Nacional, Bogota", text: "Implementamos Amautia en todo el departamento. Los profesores estan encantados y los alumnos reciben feedback al instante." },
  { name: "Ana Flores Quispe", role: "Profesora de Matematicas", institution: "IE Tupac Amaru, Cusco", text: "Generar examenes variados ahora toma 2 minutos. Antes me llevaba toda la tarde preparar evaluaciones diferentes." },
  { name: "Jose Rodriguez Paz", role: "Director Academico", institution: "Colegio Nacional, Ica", text: "Las estadisticas me ayudan a identificar exactamente que temas necesitan refuerzo en cada seccion. Es un cambio total." },
  { name: "Rosa Chavez Morales", role: "Profesora de Ciencias", institution: "IE Maria Auxiliadora, Arequipa", text: "El tutor IA le da confianza a mis alumnos para preguntar sin miedo. Han mejorado sus notas en un 25% este semestre." },
  { name: "Luis Mendoza Torres", role: "Profesor de Lenguaje", institution: "Colegio San Jose, Trujillo", text: "La correccion automatica me devolvio las tardes con mi familia. Ya no paso los fines de semana corrigiendo examenes." },
  { name: "Patricia Huaman Diaz", role: "Profesora de Ingles", institution: "IE Juana Alarco, Lima", text: "La precision de la IA es sorprendente. Detecta errores que a veces se me escapan cuando corrijo manualmente." },
  { name: "Fernando Castillo Ramos", role: "Profesor de Fisica", institution: "Colegio Champagnat, Santiago", text: "Mis alumnos reciben retroalimentacion personalizada al instante. Es como tener un asistente para cada estudiante." },
];

const plans = [
  {
    name: "Gratis",
    price: "0",
    period: "para siempre",
    popular: false,
    features: [
      "5 correcciones al mes",
      "2 generaciones de examenes",
      "1 materia",
      "Hasta 20 alumnos",
      "Tutor IA basico",
    ],
  },
  {
    name: "Basico",
    price: "29",
    period: "/mes",
    popular: true,
    features: [
      "50 correcciones al mes",
      "20 generaciones de examenes",
      "5 materias",
      "Hasta 100 alumnos",
      "Tutor IA avanzado",
      "Reportes PDF",
      "Soporte prioritario",
    ],
  },
  {
    name: "Pro",
    price: "79",
    period: "/mes",
    popular: false,
    features: [
      "300 correcciones al mes",
      "Generaciones ilimitadas",
      "Materias ilimitadas",
      "Alumnos ilimitados",
      "Tutor IA premium",
      "API de acceso",
      "Soporte 24/7",
      "Multi-profesor",
    ],
  },
];

const institutions = [
  { name: "Colegio San Martin", country: "Peru" },
  { name: "Instituto Nacional", country: "Colombia" },
  { name: "Liceo Bolivariano", country: "Venezuela" },
  { name: "Colegio Champagnat", country: "Chile" },
  { name: "IE Maria Auxiliadora", country: "Ecuador" },
];

/* ─── Exam Mockup ─────────────────────────────────────────────────── */

function ExamMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-2xl">
        {/* Scan line overlay */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent animate-scan-line" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
          <div>
            <div className="text-sm font-bold text-white tracking-wide">Examen de Historia - 5A</div>
            <div className="text-xs text-white/30 mt-0.5">Prof. Garcia - 15 preguntas</div>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
            <span className="text-xs font-semibold text-emerald-400">Corregido</span>
          </div>
        </div>

        {/* AI Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/40 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-violet-400" />
              IA analizando...
            </span>
            <span className="text-xs text-white/40">100%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-4xl font-extrabold text-white">17<span className="text-xl text-white/30">/20</span></div>
          <div>
            <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 inline-block">
              <span className="text-xs font-semibold text-emerald-400">85% - Aprobado</span>
            </div>
            <div className="text-xs text-white/30 mt-1">Calificacion final</div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-2.5">
          {[
            { n: "Pregunta 1", score: "5/5", correct: true },
            { n: "Pregunta 2", score: "4/5", correct: true },
            { n: "Pregunta 3", score: "5/5", correct: true },
          ].map((q, i) => (
            <motion.div
              key={q.n}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1 + i * 0.2, duration: 0.4 }}
            >
              <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-white/50 flex-1">{q.n}</span>
              <span className="text-xs font-semibold text-emerald-400">{q.score}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Shadow card behind */}
      <div className="absolute inset-0 rounded-2xl bg-white/[0.02] border border-white/5 transform -rotate-3 -translate-y-2 -z-10" />
      <div className="absolute inset-0 rounded-2xl bg-white/[0.01] border border-white/[0.03] transform rotate-2 translate-y-1 -z-20" />
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* ═══ STICKY NAVBAR ═══ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <GraduationCap className="h-5 w-5 text-[#09090b]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Amautia</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/40">
            <a href="#caracteristicas" className="hover:text-white/80 transition-colors duration-300">
              Caracteristicas
            </a>
            <a href="#precios" className="hover:text-white/80 transition-colors duration-300">
              Precios
            </a>
            <a href="#contacto" className="hover:text-white/80 transition-colors duration-300">
              Contacto
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/50 hover:text-white hover:bg-white/5 text-sm"
              >
                Ingresar
              </Button>
            </Link>
            <Link href="/registro">
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-400 text-[#09090b] font-semibold text-sm shadow-lg shadow-amber-500/25 rounded-lg"
              >
                Prueba gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ SECTION 1: HERO ═══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#09090b]">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 -z-[1]">
          <div className="absolute top-20 right-10 w-[600px] h-[600px] bg-violet-500/[0.12] rounded-full blur-[120px] animate-float-slow" />
          <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] animate-float-slower" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-400/[0.06] rounded-full blur-[80px]" />
        </div>
        {/* Grain */}
        <div className="absolute inset-0 -z-[0] grain pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <FadeIn>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-sm text-amber-300 mb-8">
                  <Sparkles className="h-3.5 w-3.5" />
                  +500 profesores confian en Amautia
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
                  Corrige examenes
                  <br />
                  <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                    en segundos
                  </span>
                  <br />
                  con IA
                </h1>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="text-xl text-white/60 mt-6 max-w-lg leading-relaxed">
                  Deja que la inteligencia artificial corrija mientras tu dedicas el tiempo a lo que importa: ensenar.
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-4 mt-10">
                  <Link href="/registro">
                    <Button className="h-14 px-8 text-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl shadow-lg shadow-amber-500/25 w-full sm:w-auto">
                      Empieza gratis
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                  <a href="#como-funciona">
                    <Button
                      variant="outline"
                      className="h-14 px-8 text-lg border border-white/10 text-white hover:bg-white/5 rounded-xl w-full sm:w-auto"
                    >
                      Ver demo de 2 min
                    </Button>
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={0.4}>
                <div className="flex flex-wrap gap-6 mt-8 text-sm text-white/40">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-500/70" />
                    14 dias gratis
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-500/70" />
                    Sin tarjeta
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-500/70" />
                    Cancela cuando quieras
                  </span>
                </div>
              </FadeIn>
            </div>

            {/* Right: Exam Mockup */}
            <FadeIn delay={0.4} direction="right">
              <ExamMockup />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: SOCIAL PROOF BAR ═══ */}
      <section className="py-16 bg-[#09090b] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="text-center text-white/40 text-sm uppercase tracking-widest mb-10">
              Usado por profesores en toda Latinoamerica
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-center">
              {institutions.map((inst) => (
                <div
                  key={inst.name}
                  className="flex items-center gap-2 text-white/20 hover:text-white/40 transition-colors duration-300"
                >
                  <GraduationCap className="h-5 w-5" />
                  <span className="text-sm font-medium whitespace-nowrap">{inst.name}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ SECTION 3: HOW IT WORKS ═══ */}
      <section id="como-funciona" className="py-24 bg-[#fafaf8]">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">
                COMO FUNCIONA
              </p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                Tres pasos para corregir con IA
              </h2>
              <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">
                Tan simple como tomar una foto. Obtiene calificaciones precisas con retroalimentacion detallada en segundos.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid sm:grid-cols-3 gap-8 mt-16">
            {[
              {
                n: "01",
                icon: Upload,
                title: "Sube el examen",
                desc: "Toma una foto o sube el PDF del examen de referencia con las respuestas correctas.",
              },
              {
                n: "02",
                icon: Brain,
                title: "La IA corrige",
                desc: "Sube los examenes de tus alumnos y la IA los compara con tu clave de respuestas.",
              },
              {
                n: "03",
                icon: BarChart3,
                title: "Revisa y publica",
                desc: "Revisa las calificaciones, ajusta si es necesario y comparte los resultados.",
              },
            ].map((step) => (
              <StaggerItem key={step.n}>
                <div className="text-center">
                  <div className="text-6xl font-extrabold text-amber-500/20 mb-4">{step.n}</div>
                  <div className="inline-flex p-4 rounded-2xl bg-amber-50 mb-5">
                    <step.icon className="h-7 w-7 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-base text-slate-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══ SECTION 4: FEATURES BENTO GRID ═══ */}
      <section id="caracteristicas" className="py-24 bg-[#09090b]">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <div className="mb-16">
              <p className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-3">
                FUNCIONALIDADES
              </p>
              <h2 className="text-4xl font-bold text-white tracking-tight">
                Todo lo que necesitas para evaluar mejor
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-3 gap-4">
            {/* Main card - col-span-2, row-span-2 */}
            <StaggerItem className="md:col-span-2 md:row-span-2">
              <div className="relative h-full rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 p-8 sm:p-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-2xl" />
                <div className="relative z-10">
                  <div className="inline-flex p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/10 mb-6">
                    <Scan className="h-7 w-7 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Correccion automatica con IA</h3>
                  <p className="text-white/50 max-w-lg leading-relaxed mb-8">
                    Sube la foto o PDF del examen resuelto. La inteligencia artificial corrige pregunta por pregunta, asigna puntajes y genera retroalimentacion detallada en menos de 30 segundos.
                  </p>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-white/30">
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-400/60" />
                      Resultados en 30 seg
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-400/60" />
                      94% precision
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-indigo-400/60" />
                      PDF y fotos
                    </span>
                  </div>

                  {/* Mini mockup inside main card */}
                  <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-xs text-white/40">Procesando examen...</span>
                    </div>
                    <div className="space-y-2">
                      {[85, 100, 70].map((w, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-white/20 w-6">P{i + 1}</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                              initial={{ width: "0%" }}
                              whileInView={{ width: `${w}%` }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.5 + i * 0.2, duration: 0.8 }}
                            />
                          </div>
                          <CheckCircle className="h-3 w-3 text-emerald-400/60" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* Feature: Generacion de examenes */}
            <StaggerItem>
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors duration-300">
                <div className="inline-flex p-2.5 rounded-lg bg-violet-500/10 mb-4">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Generacion de examenes</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Describe el tema, selecciona el nivel y la IA genera preguntas variadas con sus respuestas y rubricas.
                </p>
              </div>
            </StaggerItem>

            {/* Feature: Tutor IA */}
            <StaggerItem>
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors duration-300">
                <div className="inline-flex p-2.5 rounded-lg bg-emerald-500/10 mb-4">
                  <Brain className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Tutor IA para alumnos</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Cada alumno tiene un tutor IA que explica sus errores, resuelve dudas y genera ejercicios de practica.
                </p>
              </div>
            </StaggerItem>

            {/* Feature: Banco de preguntas */}
            <StaggerItem>
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors duration-300">
                <div className="inline-flex p-2.5 rounded-lg bg-sky-500/10 mb-4">
                  <Database className="h-5 w-5 text-sky-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Banco de preguntas</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Acumula y organiza preguntas de todos tus examenes. Reutiliza, combina y crea nuevas evaluaciones.
                </p>
              </div>
            </StaggerItem>

            {/* Feature: Quiz en vivo */}
            <StaggerItem>
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors duration-300">
                <div className="inline-flex p-2.5 rounded-lg bg-amber-500/10 mb-4">
                  <Zap className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Quiz en vivo</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Lanza evaluaciones rapidas en clase. Los alumnos responden desde su celular y ves resultados al instante.
                </p>
              </div>
            </StaggerItem>

            {/* Feature: Libro de calificaciones */}
            <StaggerItem>
              <div className="h-full p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors duration-300">
                <div className="inline-flex p-2.5 rounded-lg bg-rose-500/10 mb-4">
                  <BarChart3 className="h-5 w-5 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Libro de calificaciones</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Todas las notas centralizadas con promedios, tendencias y reportes exportables en PDF y Excel.
                </p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ═══ SECTION 5: RESULTS / METRICS ═══ */}
      <section className="py-24 bg-[#fafaf8]">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                Los profesores que usan Amautia
              </h2>
              <p className="text-lg text-slate-500 mt-4">
                Resultados reales de educadores en toda Latinoamerica
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid sm:grid-cols-3 gap-6">
            <StaggerItem>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                <div className="text-6xl font-extrabold text-amber-500 mb-2">
                  <CountUp value={15} suffix="h" />
                </div>
                <p className="text-lg text-slate-600">horas ahorradas por semana</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                <div className="text-6xl font-extrabold text-violet-500 mb-2">
                  <CountUp value={10} suffix="x" />
                </div>
                <p className="text-lg text-slate-600">mas rapido que corregir a mano</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
                <div className="text-6xl font-extrabold text-emerald-500 mb-2">
                  <CountUp value={94} suffix="%" />
                </div>
                <p className="text-lg text-slate-600">precision en la calificacion</p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ═══ SECTION 6: TESTIMONIALS ═══ */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 mb-12">
          <FadeIn>
            <div className="text-center">
              <p className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">TESTIMONIOS</p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                Lo que dicen los profesores
              </h2>
            </div>
          </FadeIn>
        </div>

        {/* Marquee Row 1 - scrolls left */}
        <div className="relative mb-6">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused]" style={{ width: "fit-content" }}>
            {[...testimonials.slice(0, 4), ...testimonials.slice(0, 4)].map((t, i) => (
              <div
                key={`row1-${i}`}
                className="bg-slate-50 rounded-2xl p-6 min-w-[320px] max-w-[360px] border border-slate-100 flex-shrink-0"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-base text-slate-700 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {t.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.role}, {t.institution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee Row 2 - scrolls right */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
          <div
            className="flex gap-6 animate-marquee-reverse hover:[animation-play-state:paused]"
            style={{ width: "fit-content" }}
          >
            {[...testimonials.slice(4, 8), ...testimonials.slice(4, 8)].map((t, i) => (
              <div
                key={`row2-${i}`}
                className="bg-slate-50 rounded-2xl p-6 min-w-[320px] max-w-[360px] border border-slate-100 flex-shrink-0"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-base text-slate-700 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {t.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.role}, {t.institution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 7: PRICING ═══ */}
      <section id="precios" className="py-24 bg-[#fafaf8]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">PRECIOS</p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">
                Planes simples, sin sorpresas
              </h2>
              <p className="text-lg text-slate-500">Paga con Yape, Plin o transferencia bancaria</p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <StaggerItem key={plan.name}>
                <div
                  className={`relative h-full rounded-2xl p-8 transition-all duration-300 ${
                    plan.popular
                      ? "bg-white border-2 border-amber-500 shadow-xl shadow-amber-500/10 scale-105 z-10"
                      : "bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-block bg-amber-500 text-[#09090b] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/30">
                        Mas popular
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <div className="mt-4 mb-6">
                    <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                      S/{plan.price}
                    </span>
                    <span className="ml-1 text-sm text-slate-400">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/registro" className="block">
                    <Button
                      className={`w-full h-12 font-semibold rounded-xl ${
                        plan.popular
                          ? "bg-amber-500 hover:bg-amber-400 text-[#09090b] shadow-lg shadow-amber-500/20"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                      size="lg"
                    >
                      {plan.popular ? "Empezar ahora" : "Empezar gratis"}
                    </Button>
                  </Link>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══ SECTION 8: FINAL CTA ═══ */}
      <section id="contacto" className="relative py-32 bg-[#09090b] overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 -z-[1]">
          <div className="absolute top-0 left-1/3 w-[700px] h-[500px] bg-violet-500/[0.08] rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-amber-500/[0.06] rounded-full blur-[120px]" />
        </div>
        <div className="absolute inset-0 grain pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <FadeIn>
            <h2 className="text-5xl font-bold text-white tracking-tight leading-[1.1] mb-5">
              Empieza a corregir
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                con IA hoy
              </span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-xl text-white/50 mb-10 max-w-lg mx-auto">
              Unete a cientos de profesores que ya estan transformando la forma en que evaluan a sus alumnos.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <Link href="/registro">
              <Button className="h-16 px-12 text-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl shadow-xl shadow-amber-500/25">
                Crear cuenta gratis
                <ArrowRight className="h-6 w-6 ml-3" />
              </Button>
            </Link>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="text-sm text-white/30 mt-6">
              Configuracion en 2 minutos. Sin tarjeta de credito.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ═══ SECTION 9: FOOTER ═══ */}
      <footer className="bg-[#09090b] border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-[#09090b]" />
                </div>
                <span className="font-bold text-white text-lg">Amautia</span>
              </Link>
              <p className="text-sm text-white/30 leading-relaxed mb-4">
                Plataforma educativa con IA para profesores en Latinoamerica.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-white/20 hover:text-white/50 transition-colors" aria-label="Twitter">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="#" className="text-white/20 hover:text-white/50 transition-colors" aria-label="LinkedIn">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <a href="#" className="text-white/20 hover:text-white/50 transition-colors" aria-label="Instagram">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
              </div>
            </div>

            {/* Producto */}
            <div>
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Producto</h4>
              <ul className="space-y-3">
                <li><a href="#caracteristicas" className="text-sm text-white/30 hover:text-white/60 transition-colors">Caracteristicas</a></li>
                <li><a href="#precios" className="text-sm text-white/30 hover:text-white/60 transition-colors">Precios</a></li>
                <li><a href="#como-funciona" className="text-sm text-white/30 hover:text-white/60 transition-colors">Como funciona</a></li>
                <li><a href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">Integraciones</a></li>
              </ul>
            </div>

            {/* Recursos */}
            <div>
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Recursos</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">Centro de ayuda</a></li>
                <li><a href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">Tutoriales</a></li>
                <li><a href="mailto:soporte@amautia.com" className="text-sm text-white/30 hover:text-white/60 transition-colors">Soporte</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">Terminos de servicio</a></li>
                <li><a href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">Politica de privacidad</a></li>
                <li><a href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/20">
              &copy; {new Date().getFullYear()} Amautia. Todos los derechos reservados.
            </p>
            <p className="text-sm text-white/20">
              Hecho con <span className="text-red-400">&#10084;</span> en Peru
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
