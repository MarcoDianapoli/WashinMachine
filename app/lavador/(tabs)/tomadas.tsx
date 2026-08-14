import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';
import type { Cita } from '@/types';
import { Ionicons } from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

const ESTADO_COLOR: Record<string, string> = {
  pendiente: '#f59e0b',
  confirmada: '#ef3b42',
  completada: '#10b981',
  cancelada: '#ef4444',
  en_proceso: '#3b82f6',
  listo_entrega: '#8b5cf6',
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  en_proceso: 'En Proceso',
  listo_entrega: 'Listo',
};

export default function LavadorTomadas() {
  const router = useRouter();
  const { citas, terminarCita, tema } = useApp();
  const styles = useMemo(() => getStyles(tema), [tema]);

  const tomadas = citas.filter((c) => c.estado === 'en_proceso' || c.estado === 'listo_entrega');

  const renderItem = ({ item, index }: { item: Cita, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <View style={styles.card}>
        <View style={styles.cardDatePanel}>
          <Text style={styles.cardDate}>{item.fecha}</Text>
          <Text style={styles.cardTime}>{item.hora}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.paqueteNombre}</Text>
            <View style={[styles.badge, { backgroundColor: ESTADO_COLOR[item.estado] + '20' }]}>
              <Text style={[styles.badgeText, { color: ESTADO_COLOR[item.estado] }]}>
                {ESTADO_LABEL[item.estado]}
              </Text>
            </View>
          </View>
          <Text style={styles.cardClient}>
            {item.cliente.nombre} • {item.cliente.vehiculo?.marca || item.cliente.vehiculos?.[0]?.marca} {item.cliente.vehiculo?.modelo || item.cliente.vehiculos?.[0]?.modelo}
          </Text>
          {item.estado === 'en_proceso' && (
            <TouchableOpacity style={styles.actionButton} onPress={() => terminarCita(item.id)} activeOpacity={0.8}>
              <Text style={styles.actionButtonText}>Marcar como terminado</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View entering={FadeInDown.springify()} style={styles.pageHeader}>
        <View>
          <Text style={styles.eyebrow}>OPERACIÓN</Text>
          <Text style={styles.title}>En proceso</Text>
        </View>
        <Text style={styles.count}>{String(tomadas.length).padStart(2, '0')}</Text>
      </Animated.View>

      {tomadas.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.empty}>
          <Text style={styles.emptyText}>No hay citas en proceso</Text>
          <Text style={styles.emptySubtext}>Los autos que estés lavando aparecerán aquí.</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={tomadas}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
        />
      )}

      <Animated.View entering={BounceIn.delay(300).springify()} style={styles.footer}>
        <TouchableOpacity
          style={styles.scanButton}
          activeOpacity={0.85}
          onPress={() => router.push('/lavador/scanner')}
        >
          <Ionicons name="qr-code-outline" size={24} color="white" />
          <Text style={styles.scanButtonText}>Escanear QR de Entrega</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  const isDark = tema === 'oscuro';
  
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 18 },
    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 18, paddingBottom: 16, marginBottom: 22, borderBottomWidth: 2, borderBottomColor: theme.borderStrong },
    eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.8, color: theme.textMuted },
    title: { fontSize: 42, lineHeight: 46, fontWeight: '900', letterSpacing: -1.4, color: theme.text },
    count: { color: theme.primary, fontSize: 18, fontWeight: '900', paddingBottom: 6 },
    list: { gap: 16, paddingBottom: 116 },
    card: { backgroundColor: theme.card, borderRadius: 20, overflow: 'hidden', borderWidth: isDark ? 1.5 : 1, borderColor: theme.borderStrong },
    cardDatePanel: { backgroundColor: isDark ? theme.primary : '#111111', paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardBody: { padding: 18 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: theme.text },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    cardDate: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: '#ffffff' },
    cardTime: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
    cardClient: { fontSize: 12, color: theme.textMuted, marginTop: 4, marginBottom: 12 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, fontWeight: '600', color: theme.textMuted },
    emptySubtext: { fontSize: 14, color: theme.textMuted, marginTop: 8, textAlign: 'center' },
    actionButton: { backgroundColor: theme.primary, padding: 13, borderRadius: 999, alignItems: 'center' },
    actionButtonText: { color: 'white', fontWeight: '900' },
    footer: { position: 'absolute', bottom: 18, left: 18, right: 18 },
    scanButton: {
      flexDirection: 'row',
      backgroundColor: theme.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      elevation: 6,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    scanButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  });
};
