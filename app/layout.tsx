import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SITE_URL } from "@/config/site";
import bg from "@/locales/bg.json";
import en from "@/locales/en.json";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: en.meta.title,
  description: en.meta.description,
  metadataBase: new URL(SITE_URL),
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Metrica",
    title: en.meta.title,
    description: `${bg.meta.description} / ${en.meta.description}`,
    locale: "bg_BG",
    alternateLocale: ["en_GB"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1f3a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
