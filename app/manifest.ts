import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AthletIQ",
    short_name: "AthletIQ",
    description: "Ton coach adaptatif. Programme, séance guidée, progression.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#04050d",
    theme_color: "#ff5a00",
    icons: [
      {
        src: "/brand/athletiq-icon.svg",
        type: "image/svg+xml",
        sizes: "any"
      },
      {
        src: "/brand/athletiq-icon.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any"
      },
      {
        src: "/brand/athletiq-icon.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable"
      }
    ]
  };
}
