import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp } from '@/store';
import type { Cita } from '@/types';

export default function ConfirmarCitaScreen() {
  const { paqueteId, fecha, hora } = useLocalSearchParams<{
    paqueteId: string;
    fecha: string;
    hora: string;
  }>();
  const router = useRouter();
  const { paquetes, cliente, agregarCita } = useApp();

  const paquete = paquetes.find((p) => p.id === paqueteId);

  const confirmarCita = () => {
    if (!cliente) {
      Alert.alert('Faltan datos', 'Primero configura tu información en la sección Perfil.', [
        { text: 'Ir a Perfil', onPress: () => router.replace('/(tabs)/perfil') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
      return;
    }
    if (!paquete) return;

    const nueva: Cita = {
      id: `cita-${Date.now()}`,
      paqueteId: paquete.id,
      paqueteNombre: paquete.nombre,
      fecha,
      hora,
      cliente,
      estado: 'pendiente',
    };
    agregarCita(nueva);
    router.replace('/exito');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.springify()}>
        <Text style={styles.title}>Confirmar cita</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PAQUETE SELECCIONADO</Text>
          <Text style={styles.cardTitle}>{paquete?.nombre}</Text>
          <Text style={styles.cardPrice}>{paquete?.precio}</Text>
          <Text style={styles.cardSub}>Duración: {paquete?.duracion}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>FECHA Y HORA</Text>
          <Text style={styles.cardValue}>{fecha}</Text>
          <Text style={styles.cardValue}>{hora}</Text>
        </View>
      </Animated.View>

      {cliente ? (
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>CLIENTE</Text>
            <Text style={styles.cardValue}>{cliente.nombre}</Text>
            <View style={styles.divider} />
            <Text style={styles.fieldLabel}>Teléfono</Text>
            <Text style={styles.fieldValue}>{cliente.telefono}</Text>
            <View style={styles.divider} />
            <Text style={styles.fieldLabel}>Vehículo</Text>
            <Text style={styles.fieldValue}>
              {cliente.vehiculo.marca} {cliente.vehiculo.modelo}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.fieldLabel}>Placa</Text>
            <Text style={styles.fieldValue}>{cliente.vehiculo.placa || 'Sin registrar'}</Text>
            <View style={styles.divider} />
            <Text style={styles.fieldLabel}>Color</Text>
            <Text style={styles.fieldValue}>{cliente.vehiculo.color || 'Sin registrar'}</Text>
            {cliente.personaRecoge ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.fieldLabel}>Persona que recoge</Text>
                <Text style={styles.fieldValue}>{cliente.personaRecoge}</Text>
              </>
            ) : null}
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={[styles.card, styles.warningCard]}>
            <Text style={styles.warningText}>Configura tus datos en Perfil antes de agendar.</Text>
          </View>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.actions}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.back()}>
          <Text style={styles.buttonSecondaryText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, !cliente && styles.buttonDisabled]}
          onPress={confirmarCita}
          disabled={!cliente}
        >
          <Text style={styles.buttonText}>Confirmar cita</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
  card: { backgroundColor: 'white', padding: 18, borderRadius: 12, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardLabel: { fontSize: 11, color: '#999', letterSpacing: 1.5, marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  cardPrice: { fontSize: 28, fontWeight: 'bold', color: '#dc2626', marginBottom: 4 },
  cardValue: { fontSize: 18, fontWeight: '600', marginBottom: 2 },
  cardSub: { fontSize: 14, color: '#666', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  fieldLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  fieldValue: { fontSize: 16, fontWeight: '500' },
  warningCard: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f59e0b' },
  warningText: { fontSize: 14, color: '#92400e', fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  button: { flex: 1, backgroundColor: '#dc2626', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  buttonSecondary: { flex: 1, backgroundColor: 'white', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  buttonSecondaryText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
});
