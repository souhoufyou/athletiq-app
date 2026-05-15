import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AthletIQ",
  description: "Ton coach adaptatif intelligent. Progression personnalisee, guardrails de securite, analyse de seances.",
  applicationName: "AthletIQ",
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
