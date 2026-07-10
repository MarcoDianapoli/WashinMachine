import { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';

export default function ExitoScreen() {
  const router = useRouter();
  const { tema } = useApp();
  const styles = useMemo(() => getStyles(tema), [tema]);
  
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
      <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.checkMark}>✓</Text>
      </Animated.View>
      <Animated.View style={{ opacity: opacityAnim }}>
        <Text style={styles.title}>Cita agendada</Text>
        <Text style={styles.subtitle}>Tu cita ha sido registrada exitosamente.</Text>
        <Text style={styles.redirect}>Serás redirigido a Mis Citas...</Text>
      </Animated.View>
    </View>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, padding: 30 },
    checkCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.success, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    checkMark: { fontSize: 48, color: 'white', fontWeight: 'bold', marginTop: -4 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: theme.text },
    subtitle: { fontSize: 16, color: theme.textMuted, textAlign: 'center', marginBottom: 24 },
    redirect: { fontSize: 14, color: theme.textMuted, textAlign: 'center' },
  });
};
