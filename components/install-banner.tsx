import { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import { Brand } from '@/constants/theme'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setVisible(false)
    setDeferredPrompt(null)
  }

  if (!visible) return null

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Instala la app</Text>
      <Text style={styles.subtitle}>Acceso rápido desde tu pantalla de inicio</Text>
      <View style={styles.actions}>
        <Pressable onPress={() => setVisible(false)} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>Ahora no</Text>
        </Pressable>
        <Pressable onPress={handleInstall} style={styles.installBtn}>
          <Text style={styles.installText}>Instalar</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Brand.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 9998,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.black,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Brand.gray,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
  },
  dismissText: {
    color: Brand.gray,
    fontWeight: '600',
    fontSize: 15,
  },
  installBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Brand.red,
    alignItems: 'center',
  },
  installText: {
    color: Brand.white,
    fontWeight: '600',
    fontSize: 15,
  },
})
