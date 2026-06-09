import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';

export default function ExitoScreen() {
  const router = useRouter();
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

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 30 },
  checkCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  checkMark: { fontSize: 48, color: 'white', fontWeight: 'bold', marginTop: -4 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
  redirect: { fontSize: 14, color: '#999', textAlign: 'center' },
});
