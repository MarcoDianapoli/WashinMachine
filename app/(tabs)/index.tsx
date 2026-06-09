import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { useApp } from '@/store';
import type { Cita } from '@/types';

const ESTADO_COLOR: Record<string, string> = {
  pendiente: '#f59e0b',
  confirmada: '#dc2626',
  completada: '#10b981',
  cancelada: '#ef4444',
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

function CitaCard({ item, index, onPress }: { item: Cita; index: number; onPress: (c: Cita) => void }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.paqueteNombre}</Text>
          <View style={[styles.badge, { backgroundColor: ESTADO_COLOR[item.estado] + '20' }]}>
            <Text style={[styles.badgeText, { color: ESTADO_COLOR[item.estado] }]}>
              {ESTADO_LABEL[item.estado]}
            </Text>
          </View>
        </View>
        <Text style={styles.cardDate}>{item.fecha} — {item.hora}</Text>
        <Text style={styles.cardClient}>{item.cliente.nombre} • {item.cliente.vehiculo.placa || 'sin placa'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MisCitasScreen() {
  const router = useRouter();
  const { citas, cancelarCita, eliminarCita } = useApp();
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
          onPress: () => {
            cancelarCita(citaSeleccionada.id);
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
      <Animated.View entering={FadeInDown.springify()}>
        <Text style={styles.title}>Mis Citas</Text>
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
          renderItem={({ item, index }) => (
            <CitaCard item={item} index={index} onPress={setCitaSeleccionada} />
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
                  <View style={[styles.statusBadge, { backgroundColor: ESTADO_COLOR[citaSeleccionada.estado] + '20' }]}>
                    <Text style={[styles.statusText, { color: ESTADO_COLOR[citaSeleccionada.estado] }]}>
                      {ESTADO_LABEL[citaSeleccionada.estado]}
                    </Text>
                  </View>
                </View>

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
                  <Text style={styles.detailValue}>{citaSeleccionada.cliente.telefono}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vehículo</Text>
                  <Text style={styles.detailValue}>
                    {citaSeleccionada.cliente.vehiculo.marca} {citaSeleccionada.cliente.vehiculo.modelo}
                    {citaSeleccionada.cliente.vehiculo.placa ? ` · ${citaSeleccionada.cliente.vehiculo.placa}` : ''}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
  list: { gap: 12, paddingBottom: 100 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cardDate: { fontSize: 14, color: '#666' },
  cardClient: { fontSize: 12, color: '#999', marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  nuevaCitaButton: {
    flexDirection: 'row',
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 6,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nuevaCitaIcon: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  nuevaCitaText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', flex: 1 },
  modalClose: { fontSize: 16, color: '#dc2626', fontWeight: '600' },
  detailSection: { marginBottom: 16 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  statusText: { fontSize: 14, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, color: '#111', fontWeight: '600', flex: 1, textAlign: 'right' },
  actions: { gap: 10, marginTop: 24 },
  cancelButton: { backgroundColor: '#fef3c7', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  cancelButtonText: { color: '#92400e', fontSize: 16, fontWeight: '700' },
  deleteButton: { backgroundColor: '#fef2f2', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  deleteButtonText: { color: '#dc2626', fontSize: 16, fontWeight: '700' },
});
