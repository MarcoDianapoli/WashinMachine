import { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet } from 'react-native'
import { useApp } from '@/store'
import { Brand } from '@/constants/theme'

export function Toast() {
  const { toastMessage, showToast } = useApp()
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!toastMessage) {
      opacity.setValue(0)
      return
    }

    opacity.setValue(1)
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => showToast(''))
    }, 1700)

    return () => clearTimeout(timer)
  }, [toastMessage])

  if (!toastMessage) return null

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>{toastMessage}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: Brand.success,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    zIndex: 9999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    color: Brand.white,
    fontSize: 15,
    fontWeight: '600',
  },
})
