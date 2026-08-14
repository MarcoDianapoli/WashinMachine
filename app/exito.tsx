import { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';

export default function ExitoScreen() {
  const router = useRouter();
  const { paid } = useLocalSearchParams<{ paid?: string }>();
  const { tema } = useApp();
  const styles = useMemo(() => getStyles(tema), [tema]);
  const isPaid = paid === 'true';
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      router.replace('/(tabs)');
    }, 3000);

    return () => clearTimeout(timer);
  }, [scaleAnim, opacityAnim, router]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.checkCircle, isPaid && styles.checkCirclePaid, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.checkMark}>✓</Text>
      </Animated.View>
      <Animated.View style={{ opacity: opacityAnim }}>
        <Text style={styles.title}>Cita agendada</Text>
        <Text style={styles.subtitle}>Tu cita ha sido registrada exitosamente.</Text>
        {isPaid && (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>💳 Pago confirmado</Text>
          </View>
        )}
        <Text style={styles.redirect}>Serás redirigido a Mis Citas...</Text>
      </Animated.View>
    </View>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, padding: 30 },
    checkCircle: { width: 112, height: 112, borderRadius: 56, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 28, borderWidth: 7, borderColor: theme.primarySoft },
    checkCirclePaid: { backgroundColor: '#16a34a', borderColor: '#bbf7d0' },
    checkMark: { fontSize: 48, color: 'white', fontWeight: 'bold', marginTop: -4 },
    title: { fontSize: 40, lineHeight: 44, fontWeight: '900', letterSpacing: -1.2, textAlign: 'center', marginBottom: 10, color: theme.text },
    subtitle: { fontSize: 16, color: theme.textMuted, textAlign: 'center', marginBottom: 16 },
    paidBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, alignSelf: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#bbf7d0' },
    paidBadgeText: { fontSize: 14, fontWeight: '700', color: '#166534' },
    redirect: { fontSize: 14, color: theme.textMuted, textAlign: 'center' },
  });
};
