import { useEffect } from "react"
import { Platform } from "react-native"

function injectManifestLink() {
  if (document.querySelector('link[rel="manifest"]')) return
  const link = document.createElement("link")
  link.rel = "manifest"
  link.href = "/manifest.json"
  document.head.appendChild(link)
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  })
}

export function PwaSetup() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return

    injectManifestLink()
    registerServiceWorker()
  }, [])

  return null
}
