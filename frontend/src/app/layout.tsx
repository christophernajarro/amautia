import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Amautia - Corrección de Exámenes con IA",
    template: "%s | Amautia",
  },
  description:
    "Plataforma educativa con IA para profesores en Latinoamérica. Corrige exámenes en segundos, genera evaluaciones personalizadas y ofrece un tutor IA a cada alumno.",
  keywords: [
    "corrección de exámenes",
    "inteligencia artificial educativa",
    "plataforma educativa",
    "tutor IA",
    "generación de exámenes",
    "edtech Perú",
    "corrección automática",
    "evaluación con IA",
  ],
  authors: [{ name: "Amautia" }],
  creator: "Amautia",
  metadataBase: new URL("https://amautia.com"),
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "https://amautia.com",
    siteName: "Amautia",
    title: "Amautia - Corrección de Exámenes con IA",
    description:
      "Corrige exámenes en segundos con inteligencia artificial. Genera evaluaciones, ofrece tutor IA personalizado y obtén estadísticas en tiempo real.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Amautia - Plataforma educativa con IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amautia - Corrección de Exámenes con IA",
    description:
      "Corrige exámenes en segundos con inteligencia artificial. Genera evaluaciones y ofrece tutor IA personalizado.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
        <link rel="canonical" href="https://amautia.com" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Amautia" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
