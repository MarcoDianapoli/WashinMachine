import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Horario } from '@/types';
import { useApp } from '@/store';

const HORARIOS: Horario[] = [
  { id: '1', hora: '09:00', disponible: true },
  { id: '2', hora: '10:00', disponible: true },
  { id: '3', hora: '11:00', disponible: false },
  { id: '4', hora: '12:00', disponible: true },
  { id: '5', hora: '13:00', disponible: false },
  { id: '6', hora: '14:00', disponible: true },
  { id: '7', hora: '15:00', disponible: true },
  { id: '8', hora: '16:00', disponible: true },
  { id: '9', hora: '17:00', disponible: false },
  { id: '10', hora: '18:00', disponible: true },
];

export default function HorariosScreen() {
  const { paqueteId } = useLocalSearchParams<{ paqueteId: string }>();
  const router = useRouter();
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>('2026-06-08');
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string | null>(null);
  const { paquetes } = useApp();

  const paquete = paquetes.find((p) => p.id === paqueteId);

  const dias = [
    { label: 'Lun 08', value: '2026-06-08' },
    { label: 'Mar 09', value: '2026-06-09' },
    { label: 'Mié 10', value: '2026-06-10' },
    { label: 'Jue 11', value: '2026-06-11' },
    { label: 'Vie 12', value: '2026-06-12' },
  ];

  const confirmar = () => {
    if (!horarioSeleccionado || !paqueteId) return;
    const slot = HORARIOS.find((h) => h.id === horarioSeleccionado);
    if (!slot) return;
    router.push({
      pathname: '/confirmar-cita',
      params: { paqueteId, fecha: diaSeleccionado, hora: slot.hora },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.paqueteInfo}>
        <Text style={styles.paqueteNombre}>{paquete?.nombre ?? 'Paquete'}</Text>
        <Text style={styles.paqueteDetalle}>{paquete?.duracion} • {paquete?.precio}</Text>
      </View>

      <Text style={styles.sectionTitle}>Selecciona un día</Text>
      <FlatList
        horizontal
        data={dias}
        keyExtractor={(d) => d.value}
        contentContainerStyle={styles.diasContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.diaCard, diaSeleccionado === item.value && styles.diaCardActivo]}
            onPress={() => { setDiaSeleccionado(item.value); setHorarioSeleccionado(null); }}
          >
            <Text style={[styles.diaText, diaSeleccionado === item.value && styles.diaTextActivo]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionTitle}>Horarios disponibles</Text>
      <FlatList
        data={HORARIOS}
        keyExtractor={(h) => h.id}
        numColumns={3}
        contentContainerStyle={styles.horariosContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.horarioCard,
              !item.disponible && styles.horarioNoDisponible,
              horarioSeleccionado === item.id && styles.horarioSeleccionado,
            ]}
            onPress={() => item.disponible && setHorarioSeleccionado(item.id)}
            disabled={!item.disponible}
          >
            <Text
              style={[
                styles.horarioText,
                !item.disponible && styles.horarioTextNoDisponible,
                horarioSeleccionado === item.id && styles.horarioTextSeleccionado,
              ]}
            >
              {item.hora}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.button, !horarioSeleccionado && styles.buttonDisabled]}
        onPress={confirmar}
        disabled={!horarioSeleccionado}
      >
        <Text style={styles.buttonText}>Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  paqueteInfo: { backgroundColor: 'white', padding: 16, borderRadius: 10, marginBottom: 20 },
  paqueteNombre: { fontSize: 20, fontWeight: 'bold' },
  paqueteDetalle: { fontSize: 14, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  diasContainer: { gap: 10, marginBottom: 24 },
  diaCard: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  diaCardActivo: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  diaText: { fontSize: 14, fontWeight: '600', color: '#333' },
  diaTextActivo: { color: 'white' },
  horariosContainer: { gap: 10, marginBottom: 24 },
  horarioCard: {
    flex: 1,
    backgroundColor: 'white',
    margin: 5,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  horarioNoDisponible: { backgroundColor: '#f0f0f0', borderColor: '#e0e0e0' },
  horarioSeleccionado: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  horarioText: { fontSize: 16, fontWeight: '600', color: '#333' },
  horarioTextNoDisponible: { color: '#bbb' },
  horarioTextSeleccionado: { color: 'white' },
  button: { backgroundColor: '#dc2626', paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
