import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';
import { SpeedometerLoader } from '@/components/speedometer-loader';
import { createCheckoutApi, confirmPaymentApi } from '@/lib/api';

type PayState = 'idle' | 'creating' | 'waiting' | 'verifying' | 'paid' | 'failed' | 'pending';

export default function PagoScreen() {
  const { appointmentId, precio, paqueteNombre, fecha, hora } = useLocalSearchParams<{
    appointmentId: string;
    precio: string;
    paqueteNombre: string;
    fecha: string;
    hora: string;
  }>();
  const router = useRouter();
  const { tema, showToast, syncAppointments } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);

  const [state, setState] = useState<PayState>('idle');

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== 'paid') return;
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      syncAppointments().catch(() => {});
      router.replace({ pathname: '/exito', params: { paid: 'true' } });
    }, 2500);
    return () => clearTimeout(timer);
  }, [state]);

  const handlePay = async () => {
    if (!appointmentId) return;
    setState('creating');
    try {
      const { initPoint } = await createCheckoutApi(appointmentId);
      setState('waiting');
      const result = await WebBrowser.openAuthSessionAsync(
        initPoint,
        'autolavado://pago/retorno'
      );
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const paymentId = url.searchParams.get('payment_id') || url.searchParams.get('collection_id');
        const status = url.searchParams.get('status') || url.searchParams.get('collection_status');

        if (status === 'pending' || status === 'in_process') {
          setState('pending');
          return;
        }
        if (!paymentId || paymentId === 'null') {
          setState('failed');
          return;
        }
        setState('verifying');
        try {
          await confirmPaymentApi(appointmentId, paymentId);
          setState('paid');
        } catch {
          setState('failed');
        }
      } else {
        setState('idle');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al iniciar el pago');
      setState('failed');
    }
  };

  const handleSkip = () => {
    router.replace('/exito');
  };

  const handleRetry = () => {
    setState('idle');
  };

  const handleGoToCitas = () => {
    syncAppointments().catch(() => {});
    router.replace('/(tabs)');
  };

  if (state === 'paid') {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>
        <Animated.View style={{ opacity: opacityAnim }}>
          <Text style={styles.paidTitle}>Pago confirmado</Text>
          <Text style={styles.paidSubtitle}>Tu pago fue procesado exitosamente.</Text>
          <Text style={styles.redirect}>Serás redirigido...</Text>
        </Animated.View>
      </View>
    );
  }

  if (state === 'creating' || state === 'waiting' || state === 'verifying') {
    const msg = state === 'creating' ? 'Preparando pago' : state === 'waiting' ? 'Esperando pago' : 'Verificando pago';
    return (
      <View style={styles.container}>
        <SpeedometerLoader size={110} message={msg} />
        {state === 'waiting' && (
          <Text style={styles.waitHint}>Completa el pago en la ventana del navegador</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Reanimated.View entering={FadeInDown.springify()} style={styles.content}>
        <Text style={styles.eyebrow}>PAGO</Text>
        <Text style={styles.title}>Completa tu pago</Text>

        <Reanimated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
          <Text style={styles.cardLabel}>RESUMEN DE TU CITA</Text>
          <Text style={styles.cardPackage}>{paqueteNombre || 'Lavado'}</Text>
          <Text style={styles.cardPrice}>${precio || '0'}</Text>
          <View style={styles.cardDivider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Fecha</Text>
            <Text style={styles.cardRowValue}>{fecha || '--'}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Hora</Text>
            <Text style={styles.cardRowValue}>{hora || '--'}</Text>
          </View>
        </Reanimated.View>

        {state === 'failed' && (
          <Reanimated.View entering={FadeInDown.springify()} style={styles.errorCard}>
            <Text style={styles.errorText}>No se completó el pago. Puedes intentarlo de nuevo o pagar al llegar.</Text>
          </Reanimated.View>
        )}

        {state === 'pending' && (
          <Reanimated.View entering={FadeInDown.springify()} style={styles.pendingCard}>
            <Text style={styles.pendingText}>Tu pago está en proceso. Se reflejará en Mis Citas en cuanto se acredite.</Text>
            <TouchableOpacity style={styles.payButton} onPress={handleGoToCitas}>
              <Text style={styles.payButtonText}>Ir a Mis Citas</Text>
            </TouchableOpacity>
          </Reanimated.View>
        )}

        {(state === 'idle' || state === 'failed') && (
          <Reanimated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity style={styles.payButton} onPress={handlePay} activeOpacity={0.85}>
              <Text style={styles.payButtonText}>💳  Pagar con Mercado Pago</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipButtonText}>Pagar al llegar</Text>
            </TouchableOpacity>

            {state === 'failed' && (
              <TouchableOpacity style={styles.retryLink} onPress={handleRetry}>
                <Text style={styles.retryLinkText}>Reintentar</Text>
              </TouchableOpacity>
            )}
          </Reanimated.View>
        )}
      </Reanimated.View>
    </View>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  const isDark = tema === 'oscuro';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' },
    content: { width: '100%', paddingHorizontal: 22, paddingTop: 28 },
    eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.3, color: theme.textMuted },
    title: { fontSize: 38, lineHeight: 43, fontWeight: '900', letterSpacing: -1.2, marginBottom: 24, marginTop: 3, color: theme.text },
    card: { backgroundColor: theme.card, padding: 22, borderRadius: 22, borderWidth: isDark ? 1.5 : 1, borderColor: theme.borderStrong, marginBottom: 24 },
    cardLabel: { fontSize: 10, fontWeight: '800', color: theme.textMuted, letterSpacing: 1.8, marginBottom: 10 },
    cardPackage: { fontSize: 22, fontWeight: '900', color: theme.text, marginBottom: 4 },
    cardPrice: { fontSize: 40, fontWeight: '900', color: theme.primary, marginBottom: 4 },
    cardDivider: { height: 1, backgroundColor: theme.border, marginVertical: 14 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    cardRowLabel: { fontSize: 14, color: theme.textMuted },
    cardRowValue: { fontSize: 16, fontWeight: '600', color: theme.text },
    payButton: { backgroundColor: theme.primary, paddingVertical: 18, borderRadius: 999, alignItems: 'center', marginBottom: 14 },
    payButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
    skipButton: { paddingVertical: 14, alignItems: 'center' },
    skipButtonText: { color: theme.textMuted, fontSize: 16, fontWeight: '500' },
    retryLink: { paddingVertical: 10, alignItems: 'center' },
    retryLinkText: { color: theme.primary, fontSize: 14, fontWeight: '600' },
    errorCard: { backgroundColor: isDark ? '#3f1515' : '#fef2f2', padding: 16, borderRadius: 16, marginBottom: 18, borderWidth: 1, borderColor: isDark ? '#7f1d1d' : '#fecaca' },
    errorText: { fontSize: 14, color: isDark ? '#fca5a5' : '#991b1b', lineHeight: 20 },
    pendingCard: { backgroundColor: isDark ? '#1a1a2e' : '#eff6ff', padding: 16, borderRadius: 16, marginBottom: 18, borderWidth: 1, borderColor: isDark ? '#1e3a5f' : '#bfdbfe' },
    pendingText: { fontSize: 14, color: isDark ? '#93c5fd' : '#1e40af', lineHeight: 20, marginBottom: 14 },
    waitHint: { fontSize: 14, color: theme.textMuted, textAlign: 'center', marginTop: 20, paddingHorizontal: 30 },
    checkCircle: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 7, borderColor: '#bbf7d0' },
    checkMark: { fontSize: 48, color: 'white', fontWeight: 'bold', marginTop: -4 },
    paidTitle: { fontSize: 38, fontWeight: '900', letterSpacing: -1, textAlign: 'center', color: theme.text, marginBottom: 10 },
    paidSubtitle: { fontSize: 16, color: theme.textMuted, textAlign: 'center', marginBottom: 24 },
    redirect: { fontSize: 14, color: theme.textMuted, textAlign: 'center' },
  });
};
