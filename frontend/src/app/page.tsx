"use client";

import Link from "next/link";
import {
  GraduationCap, Sparkles, FileText, Brain, BarChart3,
  ArrowRight, Check, Zap, Upload, CheckCircle, Database,
  Star, ChevronDown, Play, Shield, Clock, MessageCircle, Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { DemoModal } from "@/components/demo-modal";

/* ─── CountUp ────────────────────────────────────────────────────── */
function CountUp({ end, suffix = "", prefix = "", duration = 2000 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * end));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref} className="tabular-nums">{prefix}{count}{suffix}</span>;
}

/* ─── Reveal ─────────────────────────────────────────────────────── */
const reveal = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
} as const;

/* ─── Data ───────────────────────────────────────────────────────── */
const features = [
  { title: "Corrección automática con IA", desc: "Sube la foto del examen resuelto. La IA lo corrige pregunta por pregunta, genera retroalimentación detallada y asigna puntaje según tu rúbrica.", icon: FileText, gradient: "from-amber-500 to-orange-600", span: "md:col-span-2 md:row-span-2", large: true },
  { title: "Generación de exámenes", desc: "Describe el tema y obtén un examen completo con clave de respuestas.", icon: Sparkles, gradient: "from-violet-500 to-indigo-600" },
  { title: "Tutor IA personalizado", desc: "Cada alumno tiene un tutor que explica, genera ejercicios y crea planes de estudio.", icon: Brain, gradient: "from-emerald-500 to-teal-600" },
  { title: "Quiz en vivo", desc: "Quizzes interactivos en tiempo real con PIN, leaderboard y puntuación instantánea.", icon: Zap, gradient: "from-amber-400 to-yellow-500" },
  { title: "Banco de preguntas", desc: "Organiza preguntas por tema, reutiliza y genera exámenes automáticamente.", icon: Database, gradient: "from-sky-500 to-blue-600" },
  { title: "Calificaciones y analíticas", desc: "Libro de calificaciones, promedios ponderados y análisis psicométrico.", icon: BarChart3, gradient: "from-rose-500 to-pink-600" },
];

const steps = [
  { num: "01", title: "Sube el examen", desc: "Fotografía o escanea el examen modelo con las respuestas correctas.", icon: Upload },
  { num: "02", title: "La IA analiza", desc: "Sube los exámenes de alumnos. La IA procesa todo en paralelo en segundos.", icon: Sparkles },
  { num: "03", title: "Resultados al instante", desc: "Nota por pregunta, retroalimentación personalizada y estadísticas de clase.", icon: CheckCircle },
];

const stats = [
  { value: 15, suffix: "h", label: "ahorradas por semana", color: "border-t-amber-500" },
  { value: 10, suffix: "x", label: "más rápido que corregir a mano", color: "border-t-violet-500" },
  { value: 94, suffix: "%", label: "precisión de la IA", color: "border-t-emerald-500" },
];

const testimonials = [
  { quote: "Reduje el tiempo de corrección de 4 horas a 10 minutos. La retroalimentación que genera la IA es increíblemente detallada.", author: "Prof. María García", institution: "Colegio San Marcos, Lima", photo: "/testimonials/maria.jpg" },
  { quote: "Mis alumnos mejoraron un 30% en sus notas usando el tutor IA. Es como tener un asistente para cada uno.", author: "Prof. Carlos Rivera", institution: "Universidad Nacional de Ingeniería", photo: "/testimonials/carlos.jpg" },
  { quote: "Generar exámenes variados ahora me toma 2 minutos. Antes me llevaba toda la tarde del domingo.", author: "Prof. Ana Flores", institution: "I.E. Túpac Amaru, Cusco", photo: "/testimonials/ana.jpg" },
  { quote: "Las estadísticas me ayudan a identificar exactamente qué temas necesitan refuerzo antes del examen final.", author: "Prof. José Quispe", institution: "Colegio Nacional, Ica", photo: "/testimonials/jose.jpg" },
  { quote: "El tutor IA le da confianza a mis alumnos para preguntar sin miedo. Lo usan más que el WhatsApp.", author: "Prof. Rosa Chávez", institution: "I.E. María Auxiliadora, Trujillo", photo: "/testimonials/rosa.jpg" },
  { quote: "La corrección automática me devolvió las tardes con mi familia. No exagero, me cambió la vida.", author: "Prof. Luis Mendoza", institution: "Colegio San José, Arequipa", photo: "/testimonials/luis.jpg" },
];

const plans = [
  { name: "Básico", price: "29", features: ["3 materias", "50 correcciones/mes", "Tutor IA básico", "Exportar resultados", "Soporte por email"], popular: false },
  { name: "Profesional", price: "59", features: ["Materias ilimitadas", "200 correcciones/mes", "Tutor IA avanzado", "Generación de exámenes", "Quiz en vivo", "Banco de preguntas", "Reportes PDF", "Soporte prioritario"], popular: true },
  { name: "Institucional", price: "149", features: ["Todo lo de Profesional", "Correcciones ilimitadas", "Multi-profesor", "Analíticas avanzadas", "Certificados", "API acceso", "Soporte 24/7"], popular: false },
];

const faqs = [
  { q: "¿Cómo funciona la corrección con IA?", a: "Subes una foto o PDF del examen modelo con las respuestas correctas, luego subes los exámenes de tus alumnos. La IA compara cada respuesta con la clave, asigna puntaje según tu rúbrica y genera retroalimentación personalizada." },
  { q: "¿Qué tan precisa es la corrección?", a: "Nuestra IA alcanza un 94% de precisión en corrección. Siempre puedes revisar y ajustar las calificaciones antes de publicar los resultados a los alumnos." },
  { q: "¿Mis datos y exámenes están seguros?", a: "Sí. Usamos encriptación de extremo a extremo, los archivos se almacenan en servidores seguros y nunca compartimos información con terceros. Cumplimos con las normativas de protección de datos." },
  { q: "¿Qué formatos de archivo acepta?", a: "Aceptamos PDF, imágenes (JPG, PNG) y documentos Word. Puedes tomar una foto directamente desde tu celular o escanear el examen." },
  { q: "¿Puedo probar gratis antes de pagar?", a: "Sí. Ofrecemos 14 días de prueba gratuita con acceso completo a todas las funcionalidades. No necesitas tarjeta de crédito para empezar." },
  { q: "¿Cómo funciona el soporte?", a: "Ofrecemos soporte por email para el plan Básico, soporte prioritario por chat para Profesional, y soporte 24/7 con línea directa para el plan Institucional." },
];

/* ─── Structured Data (SEO / AEO) ────────────────────────────────── */
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Amautia",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web",
        "url": "https://amautia.com",
        "description": "Plataforma educativa con IA para corrección automática de exámenes, generación de evaluaciones y tutor IA personalizado para profesores en Latinoamérica.",
        "offers": [
          {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "PEN",
            "name": "Plan Gratuito",
            "description": "14 días de prueba gratis"
          },
          {
            "@type": "Offer",
            "price": "29",
            "priceCurrency": "PEN",
            "name": "Plan Básico"
          },
          {
            "@type": "Offer",
            "price": "59",
            "priceCurrency": "PEN",
            "name": "Plan Profesional"
          },
          {
            "@type": "Offer",
            "price": "149",
            "priceCurrency": "PEN",
            "name": "Plan Institucional"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "127",
          "bestRating": "5"
        },
        "featureList": [
          "Corrección automática de exámenes con IA",
          "Generación de exámenes con inteligencia artificial",
          "Tutor IA personalizado para cada alumno",
          "Quiz en vivo con PIN",
          "Banco de preguntas reutilizable",
          "Libro de calificaciones digital",
          "Estadísticas y analíticas psicométricas",
          "Evaluación por pares",
          "Detección de plagio",
          "Certificados digitales"
        ]
      },
      {
        "@type": "Organization",
        "name": "Amautia",
        "url": "https://amautia.com",
        "logo": "https://amautia.com/icons/icon-512.png",
        "sameAs": [],
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "PE",
          "addressLocality": "Lima"
        },
        "areaServed": [
          { "@type": "Country", "name": "Peru" },
          { "@type": "Country", "name": "Colombia" },
          { "@type": "Country", "name": "Mexico" },
          { "@type": "Country", "name": "Chile" },
          { "@type": "Country", "name": "Argentina" }
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "ventas@necs.pe",
          "contactType": "customer support",
          "availableLanguage": "Spanish"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "¿Cómo funciona la corrección de exámenes con IA de Amautia?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Subes una foto o PDF del examen modelo con las respuestas correctas, luego subes los exámenes de tus alumnos. La IA compara cada respuesta con la clave, asigna puntaje según tu rúbrica y genera retroalimentación personalizada en menos de 30 segundos."
            }
          },
          {
            "@type": "Question",
            "name": "¿Qué tan precisa es la corrección automática con IA?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "La IA de Amautia alcanza un 94% de precisión en corrección. Siempre puedes revisar y ajustar las calificaciones antes de publicar los resultados a los alumnos."
            }
          },
          {
            "@type": "Question",
            "name": "¿Amautia funciona en Perú, Colombia y México?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sí, Amautia está disponible para profesores en toda Latinoamérica. Más de 500 profesores en Perú, Colombia, México, Chile y Argentina ya usan la plataforma. Los pagos se aceptan en moneda local."
            }
          },
          {
            "@type": "Question",
            "name": "¿Cuánto cuesta Amautia?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Amautia ofrece 14 días de prueba gratuita. Los planes van desde S/29/mes (Básico) hasta S/149/mes (Institucional). No se requiere tarjeta de crédito para empezar."
            }
          },
          {
            "@type": "Question",
            "name": "¿Qué formatos de examen acepta Amautia?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Amautia acepta PDF, imágenes (JPG, PNG) y documentos Word. Puedes tomar una foto directamente desde tu celular o escanear el examen."
            }
          },
          {
            "@type": "Question",
            "name": "¿Amautia incluye un tutor IA para los alumnos?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sí, cada alumno tiene acceso a un tutor IA personalizado que explica sus errores, resuelve dudas, genera ejercicios de práctica y crea planes de estudio adaptados a sus necesidades."
            }
          }
        ]
      },
      {
        "@type": "HowTo",
        "name": "Cómo corregir exámenes con IA usando Amautia",
        "description": "Guía paso a paso para corregir exámenes automáticamente con inteligencia artificial en Amautia.",
        "step": [
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "Sube el examen de referencia",
            "text": "Fotografía o escanea el examen modelo con las respuestas correctas y súbelo a Amautia."
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "La IA corrige automáticamente",
            "text": "Sube los exámenes de tus alumnos. La IA los procesa en paralelo, comparando cada respuesta con la clave."
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "Revisa y publica resultados",
            "text": "Revisa las calificaciones generadas, ajusta si es necesario y comparte los resultados con retroalimentación personalizada."
          }
        ],
        "totalTime": "PT2M"
      },
      {
        "@type": "WebSite",
        "name": "Amautia",
        "url": "https://amautia.com",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://amautia.com/?q={search_term_string}",
          "query-input": "required name=search_term_string"
        },
        "inLanguage": "es"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [annual, setAnnual] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#06060a] text-white overflow-x-hidden">
      <StructuredData />
      {/* ═══════ NAV ═══════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#06060a]/95 backdrop-blur-md border-b border-white/[0.06]" : ""}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Amautia</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[["Funciones", "#funciones"], ["Proceso", "#proceso"], ["Precios", "#precios"], ["FAQ", "#faq"]].map(([label, href]) => (
              <a key={href} href={href} className="text-[15px] text-white/70 hover:text-white transition-colors duration-300">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="hidden sm:inline-flex h-11 px-5 items-center text-[15px] text-white/70 hover:text-white transition-colors">Ingresar</button>
            </Link>
            <Link href="/registro">
              <button className="h-11 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[15px] font-semibold text-white hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30">
                Prueba gratis
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section ref={heroRef} className="relative pt-20 pb-12 overflow-hidden">
        {/* Gradient orbs — static, no animation, reduced blur for performance */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-violet-600/[0.06] blur-[120px]" />
          <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] rounded-full bg-amber-500/[0.07] blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
            {/* Left */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/[0.06] mb-8">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" /></span>
                <span className="text-sm text-amber-300/90 font-medium">+500 profesores confían en Amautia</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="text-[clamp(2.5rem,6vw,5.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
                Corrige exámenes{" "}
                <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">en segundos</span>{" "}
                con inteligencia artificial
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-xl text-white/70 mt-7 max-w-xl leading-relaxed">
                Deja que la IA corrija mientras tú dedicas el tiempo a lo que importa: enseñar. Retroalimentación detallada en cada pregunta.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="flex flex-wrap gap-4 mt-10">
                <Link href="/registro">
                  <button className="h-14 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-lg font-semibold text-white flex items-center gap-2 hover:from-amber-400 hover:to-amber-500 transition-all shadow-xl shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-0.5">
                    Comienza gratis <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
                <button onClick={() => setShowDemo(true)} className="h-14 px-8 rounded-xl border border-white/[0.1] text-lg font-medium flex items-center gap-2 hover:bg-white/[0.04] transition-all">
                  <Play className="h-4 w-4" /> Ver demostración
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.5 }} className="flex flex-wrap gap-6 mt-8 text-sm text-white/60">
                {["14 días gratis", "Sin tarjeta de crédito", "+500 profesores"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500/70" />{t}</span>
                ))}
              </motion.div>
            </div>

            {/* Right — Exam mockup */}
            <motion.div initial={{ opacity: 0, x: 40, rotateY: -5 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} transition={{ duration: 0.9, delay: 0.3 }} className="relative hidden lg:block">
              <div className="absolute -inset-20 rounded-full bg-gradient-to-br from-amber-500/10 to-violet-500/5 blur-3xl" />
              <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.01] p-8 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-amber-400/70 font-bold">Examen de Historia</p>
                    <p className="text-sm text-white/60 mt-1">Sección A — Prof. García</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-extrabold text-emerald-400">18<span className="text-xl text-white/50">/20</span></p>
                    <p className="text-xs text-white/50 mt-1">Nota final</p>
                  </div>
                </div>
                <div className="border-t border-white/[0.06] pt-5 space-y-4">
                  {[["Pregunta 1", 5, 5], ["Pregunta 2", 4, 5], ["Pregunta 3", 5, 5], ["Pregunta 4", 4, 5]].map(([label, score, max], i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-sm text-white/50 w-24">{label}</span>
                      <div className="flex-1 h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${((score as number) / (max as number)) * 100}%` }} transition={{ duration: 1, delay: 0.5 + i * 0.15, ease: "easeOut" }} className={`h-full rounded-full ${score === max ? "bg-emerald-500" : "bg-amber-500"}`} />
                      </div>
                      <span className={`text-sm font-semibold w-10 text-right ${score === max ? "text-emerald-400" : "text-amber-400"}`}>{score}/{max}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/[0.08] to-indigo-500/[0.04] border border-violet-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-violet-300/80">Retroalimentación IA</span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">Excelente dominio del tema. Revisar cronología del Virreinato en la pregunta 2 para mejorar la precisión histórica.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats bar — normal flow, not absolute */}
        <div className="border-t border-white/[0.04] mt-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 grid grid-cols-3 gap-8">
            {[["10x", "más rápido"], ["94%", "precisión IA"], ["+500", "profesores"]].map(([num, label]) => (
              <div key={num} className="text-center">
                <p className="text-2xl lg:text-3xl font-extrabold text-white/90">{num}</p>
                <p className="text-sm text-white/45 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SOCIAL PROOF ═══════ */}
      <section className="py-16 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-center text-sm text-white/50 uppercase tracking-[0.2em] font-medium mb-10">Usado por profesores en toda Latinoamérica</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
            {["Colegio San Marcos", "Universidad Nacional", "I.E. Túpac Amaru", "Colegio San José", "Instituto Pedagógico"].map((name) => (
              <span key={name} className="text-white/35 text-lg font-semibold tracking-wide hover:text-white/50 transition-colors">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section id="funciones" className="py-16 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/[0.03] blur-[150px]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-10">
            <span className="inline-block text-xs uppercase tracking-[0.25em] font-bold text-amber-400 bg-amber-400/[0.08] px-4 py-2 rounded-full mb-6">Funcionalidades</span>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
              Todo lo que necesitas para<br />
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">evaluar mejor</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={f.title} className={`group relative rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-7 hover:border-amber-500/20 hover:shadow-xl hover:shadow-amber-500/[0.03] hover:-translate-y-1 transition-all duration-500 ${f.span || ""}`}>
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className={`font-bold mb-3 ${f.large ? "text-2xl" : "text-lg"}`}>{f.title}</h3>
                <p className={`text-white/70 leading-relaxed ${f.large ? "text-base max-w-md" : "text-sm"}`}>{f.desc}</p>
                {f.large && (
                  <div className="mt-6 flex gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-400/70"><Clock className="h-4 w-4" /> Resultados en 30 seg</span>
                    <span className="flex items-center gap-1.5 text-amber-400/70"><Shield className="h-4 w-4" /> 94% precisión</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="proceso" className="py-16 bg-[#0a0a10] relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-xs uppercase tracking-[0.25em] font-bold text-violet-400 bg-violet-400/[0.08] px-4 py-2 rounded-full mb-6">Proceso</span>
            <h2 className="text-4xl lg:text-5xl font-bold">Tres pasos. <span className="text-white/60">Cero estrés.</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {steps.map((step, i) => (
              <div key={step.num} className="text-center relative">
                <div className="relative inline-flex items-center justify-center mb-8">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] flex items-center justify-center">
                    <step.icon className="h-7 w-7 text-amber-400" />
                  </div>
                  <span className="absolute -top-3 -right-3 text-xs font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent text-2xl">{step.num}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-white/60 max-w-xs mx-auto leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="py-14 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a10] via-[#06060a] to-[#06060a]" />
        <div className="max-w-5xl mx-auto px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-3 gap-6">
            {stats.map((s, i) => (
              <div key={s.label} className={`rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 text-center border-t-2 ${s.color}`}>
                <p className="text-6xl font-extrabold tracking-tight">
                  <CountUp end={s.value} suffix={s.suffix} />
                </p>
                <p className="text-white/60 mt-3 text-lg">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-10">
          <div className="text-center">
            <span className="inline-block text-xs uppercase tracking-[0.25em] font-bold text-emerald-400 bg-emerald-400/[0.08] px-4 py-2 rounded-full mb-6">Testimonios</span>
            <h2 className="text-4xl lg:text-5xl font-bold">Lo que dicen los profesores</h2>
          </div>
        </div>

        {/* Marquee */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#06060a] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#06060a] to-transparent z-10" />
          {[false, true].map((reverse, rowIdx) => (
            <div key={rowIdx} className={`flex gap-6 ${rowIdx === 1 ? "mt-6" : ""}`}>
              <div className={`flex gap-6 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
                {[...testimonials, ...testimonials].map((t, i) => (
                  <div key={i} className="min-w-[380px] max-w-[380px] rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shrink-0">
                    <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                    <p className="text-[15px] text-white/60 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <img src={t.photo} alt={t.author} className="h-11 w-11 rounded-full object-cover border-2 border-white/10" />
                      <div>
                        <p className="text-sm font-semibold text-white/80">{t.author}</p>
                        <p className="text-xs text-white/50">{t.institution}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="precios" className="py-16 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-amber-500/[0.03] blur-[150px]" />
        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative">
          <div className="text-center mb-10">
            <span className="inline-block text-xs uppercase tracking-[0.25em] font-bold text-amber-400 bg-amber-400/[0.08] px-4 py-2 rounded-full mb-6">Precios</span>
            <h2 className="text-4xl lg:text-5xl font-bold">Planes simples y transparentes</h2>
            <p className="text-lg text-white/60 mt-4">Paga con Yape, Plin o transferencia bancaria</p>
          </div>

          {/* Urgency banner */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" /></span>
              Oferta de lanzamiento: primeros 100 profesores con 30% de descuento
            </span>
          </div>

          {/* Monthly / Annual toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!annual ? "text-white" : "text-white/60"}`}>Mensual</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative h-8 w-14 rounded-full transition-colors ${annual ? "bg-amber-500" : "bg-white/10"}`}
            >
              <div className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${annual ? "translate-x-7" : "translate-x-1"}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-white" : "text-white/60"}`}>
              Anual <span className="text-amber-400 font-bold">-20%</span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, i) => (
              <div key={plan.name} className={`rounded-2xl p-8 border transition-all duration-500 ${plan.popular ? "bg-gradient-to-b from-amber-500/[0.08] to-transparent border-amber-500/30 scale-[1.03] shadow-xl shadow-amber-500/[0.05]" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"}`}>
                {plan.popular && <span className="inline-block text-xs font-bold uppercase tracking-[0.15em] text-amber-400 bg-amber-400/[0.1] px-3 py-1 rounded-full mb-4">Más popular</span>}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-5xl font-extrabold">S/{annual ? Math.round(parseInt(plan.price) * 0.8) : plan.price}</span>
                  <span className="text-white/60 ml-2">/{annual ? "mes (facturado anual)" : "mes"}</span>
                </div>
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-[15px] text-white/60">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === "Institucional" ? "mailto:ventas@necs.pe?subject=Demo%20Plan%20Institucional" : "/registro"}>
                  <button className={`w-full h-12 rounded-xl font-semibold transition-all ${plan.popular ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20" : "border border-white/[0.1] text-white hover:bg-white/[0.04]"}`}>
                    {plan.name === "Institucional" ? "Agendar demostración" : plan.popular ? "Empezar ahora" : "Empezar gratis"}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section id="faq" className="py-16 bg-[#0a0a10]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl lg:text-5xl font-bold">Preguntas frecuentes</h2>
          </div>

          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-white/[0.06]">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-6 text-left group">
                  <span className="text-lg font-semibold pr-4 group-hover:text-amber-300 transition-colors">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-white/50 shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-amber-400" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-400 ${openFaq === i ? "max-h-48 pb-6" : "max-h-0"}`}>
                  <p className="text-white/70 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-500/[0.05] blur-[200px]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <div>
            <h2 className="text-4xl lg:text-6xl font-extrabold leading-tight">
              ¿Listo para transformar<br />
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">tu forma de evaluar?</span>
            </h2>
            <p className="text-xl text-white/60 mt-6 max-w-2xl mx-auto">Únete a cientos de profesores que ya ahorran tiempo con Amautia.</p>
            <Link href="/registro">
              <button className="mt-10 h-16 px-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-xl font-bold text-white flex items-center gap-3 mx-auto hover:from-amber-400 hover:to-amber-500 transition-all shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/35 hover:-translate-y-1">
                Crear cuenta gratis <ArrowRight className="h-6 w-6" />
              </button>
            </Link>
            <p className="text-sm text-white/50 mt-6">Configuración en 2 minutos · Sin tarjeta de crédito</p>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-white/[0.06] pt-10 pb-20 lg:pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap justify-between gap-8 mb-8">
            {/* Brand — compact */}
            <div className="max-w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <GraduationCap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-white">Amautia</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">Plataforma educativa con IA para profesores en Latinoamérica.</p>
            </div>

            {/* Links — inline */}
            <div className="flex gap-12">
              {[
                { title: "Producto", links: [["Funciones", "#funciones"], ["Precios", "#precios"]] },
                { title: "Legal", links: [["Términos", "#"], ["Privacidad", "#"], ["Cookies", "#"]] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="text-xs font-semibold text-white/70 mb-3">{col.title}</h4>
                  <ul className="space-y-2">
                    {col.links.map(([label, href]) => (
                      <li key={label}><a href={href} className="text-xs text-white/60 hover:text-white/70 transition-colors">{label}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <h4 className="text-xs font-semibold text-white/70 mb-3">Contacto</h4>
                <ul className="space-y-2">
                  <li><a href="mailto:ventas@necs.pe" className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/70 transition-colors"><Mail className="h-3 w-3 shrink-0" />ventas@necs.pe</a></li>
                  <li><a href="https://wa.me/51918359598" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/70 transition-colors"><MessageCircle className="h-3 w-3 shrink-0" />+51 918 359 598</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom line */}
          <div className="border-t border-white/[0.06] pt-5 flex flex-wrap justify-between items-center gap-3">
            <p className="text-[11px] text-white/40">© 2026 Amautia. Todos los derechos reservados.</p>
            <p className="text-[11px] text-white/40">
              Desarrollado por{" "}
              <a href="https://pos.necs.pe/" target="_blank" rel="noopener noreferrer" className="text-amber-400/70 hover:text-amber-300 font-medium transition-colors">
                NECS Soluciones
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#06060a]/95 backdrop-blur-xl border-t border-white/[0.06] p-4 flex gap-3">
        <Link href="/registro" className="flex-1">
          <button className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-base">
            Prueba gratis 14 días
          </button>
        </Link>
        <a href="https://wa.me/51918359598?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Amautia" target="_blank" rel="noopener noreferrer" className="h-12 w-12 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0">
          <MessageCircle className="h-5 w-5 text-white" />
        </a>
      </div>

      {/* Demo Modal */}
      <DemoModal open={showDemo} onClose={() => setShowDemo(false)} />
    </div>
  );
}
