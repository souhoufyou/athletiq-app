"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none"
        });
        console.log("Service Worker enregistré:", registration);
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du Service Worker:", error);
      }
    };

    // Attendre que le document soit complètement chargé
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", registerServiceWorker);
      return () => document.removeEventListener("DOMContentLoaded", registerServiceWorker);
    } else {
      registerServiceWorker();
    }
  }, []);

  return null;
}
