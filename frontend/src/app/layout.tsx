import type { Metadata } from "next";
import { Nunito, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { WhatsAppButton } from "@/components/whatsapp-button";

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Amautia - Corrección de Exámenes con IA | Plataforma EdTech #1 en Perú",
    template: "%s | Amautia",
  },
  description: "Corrige exámenes en segundos con inteligencia artificial. Plataforma educativa para profesores en Perú, Colombia y México. Genera evaluaciones, tutor IA personalizado, calificaciones automáticas y estadísticas en tiempo real. Prueba gratis 14 días.",
  keywords: [
    "corrección de exámenes con IA",
    "corregir exámenes automáticamente",
    "plataforma educativa con inteligencia artificial",
    "tutor IA para alumnos",
    "generación de exámenes con IA",
    "edtech Perú",
    "edtech Colombia",
    "edtech México",
    "corrección automática de evaluaciones",
    "calificación automática exámenes",
    "herramienta para profesores",
    "software educativo",
    "plataforma para colegios",
    "exámenes con inteligencia artificial",
    "retroalimentación automática",
    "libro de calificaciones digital",
    "quiz en vivo para clases",
    "banco de preguntas educativo",
  ],
  authors: [{ name: "Amautia", url: "https://amautia.com" }],
  creator: "Amautia",
  publisher: "Amautia",
  category: "Education",
  classification: "Education Technology",
  metadataBase: new URL("https://amautia.com"),
  alternates: {
    canonical: "https://amautia.com",
    languages: {
      "es": "https://amautia.com",
      "es-PE": "https://amautia.com",
      "es-CO": "https://amautia.com",
      "es-MX": "https://amautia.com",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    alternateLocale: ["es_CO", "es_MX", "es_CL", "es_AR"],
    url: "https://amautia.com",
    siteName: "Amautia",
    title: "Amautia - Corrección de Exámenes con IA en Segundos",
    description: "Corrige exámenes en segundos con IA. +500 profesores en Latinoamérica. Genera evaluaciones, tutor IA personalizado y estadísticas en tiempo real. 14 días gratis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Amautia - Plataforma educativa con IA para profesores",
        type: "image/png",
      },
    ],
    countryName: "Peru",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amautia - Corrección de Exámenes con IA",
    description: "Corrige exámenes en segundos con IA. Genera evaluaciones y ofrece tutor IA personalizado. +500 profesores confían en Amautia.",
    images: ["/og-image.png"],
    creator: "@amautia_edu",
    site: "@amautia_edu",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "GOOGLE_VERIFICATION_CODE_HERE",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
    ],
  },
  manifest: "/manifest.json",
  other: {
    "geo.region": "PE",
    "geo.placename": "Lima, Peru",
    "geo.position": "-12.0464;-77.0428",
    "ICBM": "-12.0464, -77.0428",
    "distribution": "global",
    "rating": "general",
    "revisit-after": "7 days",
    "language": "Spanish",
    "target": "all",
    "audience": "teachers, educators, professors",
    "coverage": "Latin America",
    "og:locality": "Lima",
    "og:country-name": "Peru",
    "last-modified": "2026-03-19",
    "article:modified_time": "2026-03-19T00:00:00-05:00",
    "content-type": "original-research",
    "ai-content-summary": "Amautia es una plataforma EdTech con IA que permite a profesores corregir exámenes automáticamente en 30 segundos con 94% de precisión. Disponible en Perú, Colombia y México. Incluye corrección con IA, generación de exámenes, tutor IA personalizado, quiz en vivo, banco de preguntas y libro de calificaciones digital. Planes desde S/29/mes con 14 días de prueba gratis. Más de 500 profesores en Latinoamérica confían en Amautia.",
    "speakable": "Amautia corrige exámenes en segundos con inteligencia artificial. Más de 500 profesores en Latinoamérica ahorran 15 horas por semana usando Amautia. Ofrece corrección automática con 94% de precisión, tutor IA personalizado para cada alumno, y generación de exámenes con IA.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f59e0b" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Amautia" />
        <link rel="alternate" hrefLang="es" href="https://amautia.com" />
        <link rel="alternate" hrefLang="es-PE" href="https://amautia.com" />
        <link rel="alternate" hrefLang="es-CO" href="https://amautia.com" />
        <link rel="alternate" hrefLang="es-MX" href="https://amautia.com" />
        <link rel="alternate" hrefLang="x-default" href="https://amautia.com" />
        <meta name="ai-content-summary" content="Amautia es una plataforma educativa con IA que permite a profesores corregir exámenes automáticamente en segundos. Disponible en Perú, Colombia y México. Ofrece corrección con IA (94% precisión), generación de exámenes, tutor IA personalizado, quiz en vivo, banco de preguntas y libro de calificaciones digital. Planes desde S/29/mes con 14 días de prueba gratis." />
        <meta name="speakable" content="Amautia corrige exámenes en segundos con inteligencia artificial. Más de 500 profesores en Latinoamérica confían en Amautia para ahorrar 15 horas por semana en correcciones." />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('theme');
              var d = t === 'dark' || (t === 'system' || !t) && window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (d) document.documentElement.classList.add('dark');
            } catch(e) {}
          })();
        ` }} />
      </head>
      <body
        className={`${nunito.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
        <WhatsAppButton />
      </body>
    </html>
  );
}
