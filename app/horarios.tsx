import { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';
import { getAvailabilityApi, ApiAvailabilitySlot } from '@/lib/api';
import { SpeedometerLoader } from '@/components/speedometer-loader';

function buildDays(count: number) {
  const days: { label: string; value: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const dayName = d.toLocaleDateString('es-MX', { weekday: 'short' });
    const dayNum = d.getDate();
    days.push({
      label: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum < 10 ? '0' + dayNum : dayNum}`,
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    });
  }
  return days;
}

export default function HorariosScreen() {
  const { paqueteId } = useLocalSearchParams<{ paqueteId: string }>();
  const router = useRouter();
  const { paquetes, tema } = useApp();
  const styles = useMemo(() => getStyles(tema), [tema]);
  const theme = Colors[tema];

  const paquete = paquetes.find((p) => p.id === paqueteId);

  const dias = useMemo(() => buildDays(5), []);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(dias[0]?.value || '');
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string | null>(null);

  const [slots, setSlots] = useState<ApiAvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(true);

  // Consulta de disponibilidad real en tiempo real desde la API (como en la app web)
  useEffect(() => {
    if (!diaSeleccionado) return;
    let cancelled = false;
    setLoadingSlots(true);

    getAvailabilityApi(diaSeleccionado)
      .then((res) => {
        if (!cancelled) {
          setSlots(res);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback de horarios en caso de fallo de red
          setSlots([
            { time: '09:00', taken: 0, capacity: 2, available: true },
            { time: '10:00', taken: 0, capacity: 2, available: true },
            { time: '11:00', taken: 2, capacity: 2, available: false },
            { time: '12:00', taken: 0, capacity: 2, available: true },
            { time: '13:00', taken: 2, capacity: 2, available: false },
            { time: '14:00', taken: 0, capacity: 2, available: true },
            { time: '15:00', taken: 0, capacity: 2, available: true },
            { time: '16:00', taken: 0, capacity: 2, available: true },
            { time: '17:00', taken: 2, capacity: 2, available: false },
            { time: '18:00', taken: 0, capacity: 2, available: true },
          ]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [diaSeleccionado]);

  const confirmar = () => {
    if (!horarioSeleccionado || !paqueteId) return;
    router.push({
      pathname: '/confirmar-cita',
      params: { paqueteId, fecha: diaSeleccionado, hora: horarioSeleccionado },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>RESERVA · PASO 1 DE 2</Text>
      <Text style={styles.pageTitle}>Elige fecha y hora</Text>

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
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.diaCard, diaSeleccionado === item.value && styles.diaCardActivo]}
            onPress={() => {
              setDiaSeleccionado(item.value);
              setHorarioSeleccionado(null);
            }}
          >
            <Text style={[styles.diaText, diaSeleccionado === item.value && styles.diaTextActivo]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionTitle}>Horarios disponibles</Text>

      {loadingSlots ? (
        <View style={styles.loadingContainer}>
          <SpeedometerLoader size={124} message="Consultando disponibilidad" />
        </View>
      ) : slots.length === 0 ? (
        <Text style={{ color: theme.textMuted, marginBottom: 20 }}>
          No pudimos consultar los horarios. Intenta de nuevo en un momento.
        </Text>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(h) => h.time}
          numColumns={3}
          contentContainerStyle={styles.horariosContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.horarioCard,
                !item.available && styles.horarioNoDisponible,
                horarioSeleccionado === item.time && styles.horarioSeleccionado,
              ]}
              onPress={() => item.available && setHorarioSeleccionado(item.time)}
              disabled={!item.available}
            >
              <Text
                style={[
                  styles.horarioText,
                  !item.available && styles.horarioTextNoDisponible,
                  horarioSeleccionado === item.time && styles.horarioTextSeleccionado,
                ]}
              >
                {item.time}
              </Text>
              {!item.available && <Text style={styles.llenoText}>Lleno</Text>}
            </TouchableOpacity>
          )}
        />
      )}

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

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 18, paddingTop: 18, backgroundColor: theme.background },
    eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.3, color: theme.textMuted },
    pageTitle: { fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1, color: theme.text, marginTop: 3, marginBottom: 18 },
    paqueteInfo: { backgroundColor: theme.card, padding: 18, borderRadius: 20, marginBottom: 22, borderWidth: 1, borderColor: theme.borderStrong },
    paqueteNombre: { fontSize: 21, fontWeight: '900', color: theme.text },
    paqueteDetalle: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
    sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.1, marginBottom: 12, color: theme.textMuted, textTransform: 'uppercase' },
    diasContainer: { gap: 10, marginBottom: 24, paddingVertical: 4 },
    diaCard: {
      backgroundColor: theme.card,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.borderStrong,
    },
    diaCardActivo: { backgroundColor: theme.primary, borderColor: theme.primary },
    diaText: { fontSize: 14, fontWeight: '600', color: theme.text },
    diaTextActivo: { color: 'white' },
    horariosContainer: { gap: 10, marginBottom: 24 },
    horarioCard: {
      flex: 1,
      backgroundColor: theme.card,
      margin: 5,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.borderStrong,
    },
    horarioNoDisponible: { backgroundColor: theme.surfaceMuted, borderColor: theme.border, opacity: 0.55 },
    horarioSeleccionado: { backgroundColor: theme.primary, borderColor: theme.primary },
    horarioText: { fontSize: 16, fontWeight: '600', color: theme.text },
    horarioTextNoDisponible: { color: theme.textMuted },
    horarioTextSeleccionado: { color: 'white' },
    llenoText: { fontSize: 10, color: theme.textMuted, marginTop: 2 },
    loadingContainer: { padding: 30, alignItems: 'center', justifyContent: 'center' },
    button: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 999, alignItems: 'center', marginTop: 'auto', marginBottom: 12 },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '900' },
  });
};
