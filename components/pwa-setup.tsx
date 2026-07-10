import { useEffect } from "react"
import { Platform } from "react-native"

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  })
}

export function PwaSetup() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return

    // Ya no inyectamos dinámicamente el manifest porque ahora está estático en app/+html.tsx
    // lo cual es necesario para que Chrome detecte el PWA correctamente desde el inicio.
    registerServiceWorker()
  }, [])

  return null
}
