import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AthletIQ IA",
  description: "Ton coach adaptatif intelligent. Progression personnalisee, guardrails de securite, analyse de seances.",
  icons: {
    apple: "/brand/athletiq-icon.svg",
    icon: "/brand/athletiq-icon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff5a00"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
