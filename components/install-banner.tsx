import { useState, useEffect, useMemo } from 'react'
import { View, Text, Pressable, StyleSheet, Platform, Modal } from 'react-native'
import { useApp } from '@/store'
import { Colors } from '@/constants/Colors'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const { tema } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return

    // Evitar mostrarlo si ya fue descartado
    let dismissed = 'false'
    try {
      dismissed = localStorage.getItem('pwa-prompt-dismissed') || 'false'
    } catch (e) {}
    if (dismissed === 'true') return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Mostrar el pop-up incondicionalmente después de 2 segundos (si no se ha descartado)
    const timer = setTimeout(() => {
      setVisible(true)
    }, 2000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    if (Platform.OS === 'web') {
      try { localStorage.setItem('pwa-prompt-dismissed', 'true') } catch(e) {}
    }
  }

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setVisible(false)
        if (Platform.OS === 'web') {
          try { localStorage.setItem('pwa-prompt-dismissed', 'true') } catch(e) {}
        }
      }
      setDeferredPrompt(null)
    } else {
      // Fallback si no hay prompt nativo disponible
      alert('Para instalar la aplicación:\n\n1. Abre el menú de tu navegador (los 3 puntos o Compartir).\n2. Selecciona "Agregar a la pantalla de inicio" o "Instalar aplicación".');
      setVisible(false)
      if (Platform.OS === 'web') {
        try { localStorage.setItem('pwa-prompt-dismissed', 'true') } catch(e) {}
      }
    }
  }

  return (
    <Modal visible={visible} transparent>
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.title}>Instalar Autolavado</Text>
          <Text style={styles.subtitle}>Instala nuestra app web en tu pantalla de inicio para un acceso rápido y experiencia de pantalla completa.</Text>
          
          <View style={styles.actions}>
            <Pressable onPress={handleDismiss} style={styles.dismissBtn}>
              <Text style={styles.dismissText}>Ahora no</Text>
            </Pressable>
            <Pressable onPress={handleInstall} style={styles.installBtn}>
              <Text style={styles.installText}>Instalar App</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    popup: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 360,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    icon: {
      fontSize: 48,
      marginBottom: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    dismissBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    dismissText: {
      color: theme.textMuted,
      fontWeight: '600',
      fontSize: 16,
    },
    installBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: 'center',
    },
    installText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
  });
};
