import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AthletIQ - Ton Coach Adaptatif",
    short_name: "AthletIQ",
    description: "Ton coach adaptatif intelligent. Progression personnalisée, guardrails de sécurité, analyse de séances.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#ff5a00",
    background_color: "#04050d",
    icons: [
      {
        src: "/brand/athletiq-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/brand/athletiq-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/brand/athletiq-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    categories: ["sports", "fitness"],
    screenshots: [
      {
        src: "/brand/athletiq-source.png",
        sizes: "540x720",
        type: "image/png",
        form_factor: "narrow"
      }
    ]
  };
}
