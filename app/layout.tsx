import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "./service-worker-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "AthletIQ",
  description: "Ton coach adaptatif intelligent. Progression personnalisee, guardrails de securite, analyse de seances.",
  applicationName: "AthletIQ",
  metadataBase: new URL("https://athletiq.app"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "AthletIQ",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [
      { url: "/brand/athletiq-icon.svg", type: "image/svg+xml" },
      { url: "/brand/athletiq-icon.png", type: "image/png", sizes: "512x512" }
    ],
    apple: [
      { url: "/brand/athletiq-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/brand/athletiq-icon.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/brand/athletiq-icon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff5a00",
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} dark`}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
