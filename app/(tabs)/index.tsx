import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { useApp } from '@/store';
import type { Cita } from '@/types';
import { Colors } from '@/constants/Colors';

const ESTADO_COLOR: Record<string, string> = {
  pendiente: '#f59e0b',
  confirmada: '#2563eb',
  en_proceso: '#8b5cf6',
  listo_entrega: '#ec4899',
  completada: '#10b981',
  cancelada: '#ef4444',
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  en_proceso: 'En Proceso 🧼',
  listo_entrega: '¡Listo para entrega! ✨',
  completada: 'Completada / Entregado 🚗',
  cancelada: 'Cancelada',
};

function CitaCard({ item, index, onPress, theme, styles }: any) {
  const color = ESTADO_COLOR[item.estado] || '#666';
  const label = ESTADO_LABEL[item.estado] || item.estado;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.paqueteNombre}</Text>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>
              {label}
            </Text>
          </View>
        </View>
        <Text style={styles.cardDate}>{item.fecha} — {item.hora}</Text>
        {item.code ? <Text style={styles.cardCode}>Código QR: {item.code}</Text> : null}
        <Text style={styles.cardClient}>{item.cliente.nombre} • {item.cliente.vehiculo?.[0]?.modelo || item.cliente.vehiculo?.modelo || 'Auto'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MisCitasScreen() {
  const router = useRouter();
  const { citas, cancelarCita, eliminarCita, syncAppointments, tema } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);
  
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

  const confirmarCancelar = () => {
    if (!citaSeleccionada) return;
    Alert.alert(
      'Cancelar cita',
      `¿Estás seguro de cancelar la cita del ${citaSeleccionada.fecha} a las ${citaSeleccionada.hora}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            await cancelarCita(citaSeleccionada.id);
            setCitaSeleccionada(null);
          },
        },
      ]
    );
  };

  const confirmarEliminar = () => {
    if (!citaSeleccionada) return;
    Alert.alert(
      'Eliminar cita',
      'Esta acción eliminará la cita permanentemente. ¿Continuar?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: () => {
            eliminarCita(citaSeleccionada.id);
            setCitaSeleccionada(null);
          },
        },
      ]
    );
  };

  const puedeCancelar = citaSeleccionada && (citaSeleccionada.estado === 'pendiente' || citaSeleccionada.estado === 'confirmada');

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.headerRow}>
        <Text style={styles.title}>Mis Citas</Text>
        <TouchableOpacity style={styles.liveIndicator} onPress={() => syncAppointments()}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>En vivo</Text>
        </TouchableOpacity>
      </Animated.View>

      {citas.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.empty}>
          <Text style={styles.emptyText}>No tienes citas agendadas</Text>
          <Text style={styles.emptySubtext}>Presiona el botón inferior para agendar una nueva cita.</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={citas}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          onRefresh={syncAppointments}
          refreshing={false}
          renderItem={({ item, index }) => (
            <CitaCard item={item} index={index} onPress={setCitaSeleccionada} theme={theme} styles={styles} />
          )}
        />
      )}

      <Animated.View entering={BounceIn.delay(300).springify()} style={styles.footer}>
        <TouchableOpacity
          style={styles.nuevaCitaButton}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Text style={styles.nuevaCitaIcon}>+</Text>
          <Text style={styles.nuevaCitaText}>Registrar nueva cita</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={!!citaSeleccionada} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {citaSeleccionada && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{citaSeleccionada.paqueteNombre}</Text>
                  <TouchableOpacity onPress={() => setCitaSeleccionada(null)}>
                    <Text style={styles.modalClose}>Cerrar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <View style={[styles.statusBadge, { backgroundColor: (ESTADO_COLOR[citaSeleccionada.estado] || '#666') + '20' }]}>
                    <Text style={[styles.statusText, { color: ESTADO_COLOR[citaSeleccionada.estado] || '#666' }]}>
                      {ESTADO_LABEL[citaSeleccionada.estado] || citaSeleccionada.estado}
                    </Text>
                  </View>
                </View>

                {citaSeleccionada.code ? (
                  <View style={styles.qrContainer}>
                    <Text style={styles.qrLabel}>CÓDIGO DE RESERVA / QR</Text>
                    <Text style={styles.qrCodeText}>{citaSeleccionada.code}</Text>
                    <Text style={styles.qrHint}>Muestra este código al entregar o recoger tu vehículo</Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fecha</Text>
                  <Text style={styles.detailValue}>{citaSeleccionada.fecha}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hora</Text>
                  <Text style={styles.detailValue}>{citaSeleccionada.hora}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cliente</Text>
                  <Text style={styles.detailValue}>{citaSeleccionada.cliente.nombre}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Teléfono</Text>
                  <Text style={styles.detailValue}>{citaSeleccionada.cliente.telefono || 'No registrado'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vehículo</Text>
                  <Text style={styles.detailValue}>
                    {citaSeleccionada.cliente.vehiculo?.[0]?.marca || citaSeleccionada.cliente.vehiculo?.marca || 'Vehículo'} {citaSeleccionada.cliente.vehiculo?.[0]?.modelo || citaSeleccionada.cliente.vehiculo?.modelo || ''}
                  </Text>
                </View>

                <View style={styles.actions}>
                  {puedeCancelar && (
                    <TouchableOpacity style={styles.cancelButton} onPress={confirmarCancelar}>
                      <Text style={styles.cancelButtonText}>Cancelar cita</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.deleteButton} onPress={confirmarEliminar}>
                    <Text style={styles.deleteButtonText}>Eliminar cita</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  const isDark = tema === 'oscuro';
  
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    title: { fontSize: 28, fontWeight: 'bold', color: theme.text },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1e293b' : '#f0fdf4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#22c55e' },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 },
    liveText: { fontSize: 12, fontWeight: 'bold', color: '#15803d' },
    list: { gap: 12, paddingBottom: 100 },
    card: { backgroundColor: theme.card, padding: 16, borderRadius: 10, borderWidth: 1, borderColor: theme.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    cardDate: { fontSize: 14, color: theme.textMuted },
    cardCode: { fontSize: 13, fontWeight: '700', color: theme.primary, marginTop: 4 },
    cardClient: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, fontWeight: '600', color: theme.textMuted },
    emptySubtext: { fontSize: 14, color: theme.textMuted, marginTop: 8, textAlign: 'center' },
    footer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    nuevaCitaButton: {
      flexDirection: 'row',
      backgroundColor: theme.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      elevation: 6,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    nuevaCitaIcon: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    nuevaCitaText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', flex: 1, color: theme.text },
    modalClose: { fontSize: 16, color: theme.danger, fontWeight: '600' },
    detailSection: { marginBottom: 12 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
    statusText: { fontSize: 14, fontWeight: '700' },
    qrContainer: { backgroundColor: isDark ? '#1e293b' : '#f8fafc', padding: 14, borderRadius: 10, marginVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
    qrLabel: { fontSize: 11, fontWeight: 'bold', color: theme.textMuted, letterSpacing: 1 },
    qrCodeText: { fontSize: 22, fontWeight: 'bold', color: theme.primary, marginVertical: 4, letterSpacing: 2 },
    qrHint: { fontSize: 11, color: theme.textMuted, textAlign: 'center' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
    detailLabel: { fontSize: 14, color: theme.textMuted },
    detailValue: { fontSize: 14, color: theme.text, fontWeight: '600', flex: 1, textAlign: 'right' },
    actions: { gap: 10, marginTop: 24 },
    cancelButton: { backgroundColor: isDark ? '#3f1515' : '#fef3c7', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    cancelButtonText: { color: isDark ? '#fca5a5' : '#92400e', fontSize: 16, fontWeight: '700' },
    deleteButton: { backgroundColor: isDark ? '#3f1515' : '#fef2f2', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    deleteButtonText: { color: theme.danger, fontSize: 16, fontWeight: '700' },
  });
};
