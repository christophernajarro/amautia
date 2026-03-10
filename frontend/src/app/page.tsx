"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen, FileText, Sparkles, Brain, Users, BarChart3,
  CheckCircle, ArrowRight, Shield, GraduationCap, Star, Zap,
  ChevronRight
} from "lucide-react";

function LandingNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-indigo-950">Amautia</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Características</a>
          <a href="#how-it-works" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Cómo funciona</a>
          <a href="#pricing" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Precios</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Iniciar sesión</Button>
          </Link>
          <Link href="/registro">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              Empieza gratis
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          Potenciado por Inteligencia Artificial
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
          Corrige exámenes en{" "}
          <span className="text-indigo-600">segundos</span>,{" "}
          no en horas
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
          Amautia usa inteligencia artificial para corregir exámenes masivamente,
          generar evaluaciones similares y ofrecer tutoría personalizada a tus alumnos.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/registro">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-base px-8">
              Empieza gratis <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button size="lg" variant="outline" className="text-base px-8">
              Ver cómo funciona
            </Button>
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Sin tarjeta de crédito. 5 correcciones gratis al mes.
        </p>
      </div>
    </section>
  );
}

const features = [
  {
    icon: FileText,
    title: "Corrección Masiva con IA",
    description: "Sube los exámenes de todos tus alumnos y nuestra IA los corrige automáticamente con retroalimentación detallada.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Sparkles,
    title: "Generación de Exámenes",
    description: "Genera exámenes similares a partir de uno existente. Elige el nivel de dificultad: más fácil, igual o más difícil.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Brain,
    title: "Tutor IA Personalizado",
    description: "Cada alumno tiene un tutor que conoce sus debilidades, crea planes de estudio y genera ejercicios adaptados.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: BarChart3,
    title: "Rúbricas y Estadísticas",
    description: "Define criterios de evaluación detallados y obtén estadísticas completas del rendimiento de tus alumnos.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Users,
    title: "Gestión de Alumnos",
    description: "Organiza materias, secciones y alumnos. Importa listas desde Excel. Los alumnos se unen con un código.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: Shield,
    title: "Multi-formato y Multi-IA",
    description: "Soporta PDF, imágenes, Word. Usa Gemini, ChatGPT o Claude según la tarea. Configurable por el administrador.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Todo lo que necesitas para evaluar mejor
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Herramientas potentes para profesores, retroalimentación clara para alumnos.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { number: "1", title: "Sube tu examen de referencia", description: "Sube el examen resuelto o el examen vacío con las respuestas. Aceptamos PDF, imágenes y Word." },
  { number: "2", title: "Sube los exámenes de tus alumnos", description: "Arrastra todos los exámenes de tus alumnos. Nuestra IA detecta los nombres automáticamente." },
  { number: "3", title: "La IA corrige todo", description: "En minutos, cada examen es corregido pregunta por pregunta con nota y retroalimentación detallada." },
  { number: "4", title: "Revisa y publica", description: "Revisa las correcciones, ajusta si es necesario, y publica los resultados para tus alumnos." },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Cómo funciona
          </h2>
          <p className="text-lg text-slate-600">
            Corrige exámenes en 4 simples pasos
          </p>
        </div>
        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-start gap-6">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">
                {step.number}
              </div>
              <div className="pt-1">
                <h3 className="text-xl font-semibold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Gratis",
    price: "S/0",
    description: "Para probar la plataforma",
    features: ["5 correcciones/mes", "2 generaciones/mes", "20 alumnos", "2 materias", "Soporte por email"],
    cta: "Empieza gratis",
    popular: false,
  },
  {
    name: "Básico",
    price: "S/29",
    description: "Para profesores independientes",
    features: ["50 correcciones/mes", "20 generaciones/mes", "100 alumnos", "5 materias", "Tutor básico", "Exportar resultados"],
    cta: "Elegir Básico",
    popular: false,
  },
  {
    name: "Pro",
    price: "S/79",
    description: "Para profesores profesionales",
    features: ["300 correcciones/mes", "Generaciones ilimitadas", "500 alumnos", "Materias ilimitadas", "Tutor completo", "Rúbricas personalizables", "Estadísticas avanzadas", "WhatsApp"],
    cta: "Elegir Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "S/199",
    description: "Para academias y universidades",
    features: ["Todo ilimitado", "Múltiples profesores", "Dashboard de academia", "Tutor completo", "Rúbricas + estadísticas", "Soporte prioritario", "WhatsApp", "API personalizada"],
    cta: "Contactar ventas",
    popular: false,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Planes y precios
          </h2>
          <p className="text-lg text-slate-600">
            Precios accesibles para el mercado peruano. Paga con Yape o Plin.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-0 shadow-sm ${plan.popular ? "ring-2 ring-indigo-600 shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3" /> Más popular
                  </span>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 text-sm">/mes</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/registro" className="block">
                  <Button
                    className={`w-full ${plan.popular ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-white py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-indigo-950">Amautia</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Amautia. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push(ROLE_ROUTES[user.role] || "/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <Footer />
    </div>
  );
}
