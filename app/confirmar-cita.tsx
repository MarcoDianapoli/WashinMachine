import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp } from '@/store';
import type { Cita, Vehiculo } from '@/types';
import { Colors } from '@/constants/Colors';

export default function ConfirmarCitaScreen() {
  const { paqueteId, fecha, hora } = useLocalSearchParams<{
    paqueteId: string;
    fecha: string;
    hora: string;
  }>();
  const router = useRouter();
  const { paquetes, cliente, agregarCita, tema } = useApp();
  const styles = useMemo(() => getStyles(tema), [tema]);
  const theme = Colors[tema];

  const paquete = paquetes.find((p) => p.id === paqueteId);

  const misVehiculos = cliente?.vehiculos || [];
  const tieneVehiculoRegistrado = misVehiculos.length > 0;
  
  const [vehiculoSeleccionadoIdx, setVehiculoSeleccionadoIdx] = useState<number>(tieneVehiculoRegistrado ? 0 : -1);
  const [usarOtroVehiculo, setUsarOtroVehiculo] = useState(!tieneVehiculoRegistrado);
  const [otroModelo, setOtroModelo] = useState('');

  const handleSwitch = (val: boolean) => {
    setUsarOtroVehiculo(val);
    if (val) {
      setVehiculoSeleccionadoIdx(-1);
    } else if (tieneVehiculoRegistrado) {
      setVehiculoSeleccionadoIdx(0);
    }
  };

  const confirmarCita = () => {
    if (!cliente) {
      Alert.alert('Faltan datos', 'Primero configura tu información en la sección Perfil.', [
        { text: 'Ir a Perfil', onPress: () => router.replace('/(tabs)/perfil') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
      return;
    }
    if (!paquete) return;

    if (usarOtroVehiculo && !otroModelo.trim()) {
      Alert.alert('Faltan datos', 'Por favor ingresa el modelo del auto a lavar.');
      return;
    }

    let vehiculoCita: Vehiculo;
    if (usarOtroVehiculo) {
      vehiculoCita = { marca: 'Otro', modelo: otroModelo.trim(), placa: '', color: '' };
    } else {
      if (vehiculoSeleccionadoIdx === -1 || !misVehiculos[vehiculoSeleccionadoIdx]) {
        Alert.alert('Error', 'Selecciona un vehículo válido.');
        return;
      }
      vehiculoCita = misVehiculos[vehiculoSeleccionadoIdx];
    }

    const clienteAUsar = { ...cliente, vehiculo: vehiculoCita };

    const nueva: Cita = {
      id: `cita-${Date.now()}`,
      paqueteId: paquete.id,
      paqueteNombre: paquete.nombre,
      fecha,
      hora,
      cliente: clienteAUsar,
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
            <Text style={styles.cardLabel}>VEHÍCULO A LAVAR</Text>
            
            {tieneVehiculoRegistrado && !usarOtroVehiculo && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
                {misVehiculos.map((v, i) => {
                  const isSelected = i === vehiculoSeleccionadoIdx;
                  return (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => setVehiculoSeleccionadoIdx(i)}
                      style={[styles.vehiculoCard, isSelected && styles.vehiculoCardSelected]}
                    >
                      <Text style={[styles.vehiculoTitle, isSelected && styles.textWhite]}>{v.marca} {v.modelo}</Text>
                      <Text style={[styles.vehiculoSub, isSelected && styles.textWhite]}>{v.placa || 'Sin placa'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {tieneVehiculoRegistrado && (
              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Usar un vehículo no registrado</Text>
                <Switch 
                  value={usarOtroVehiculo} 
                  onValueChange={handleSwitch}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={'#fff'}
                />
              </View>
            )}

            {usarOtroVehiculo && (
              <View style={styles.otroVehiculoContainer}>
                <Text style={styles.fieldLabel}>Modelo del auto a lavar *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Jetta, Civic, etc."
                  placeholderTextColor={theme.textMuted}
                  value={otroModelo}
                  onChangeText={setOtroModelo}
                />
              </View>
            )}

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

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  const isDark = tema === 'oscuro';
  
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, marginTop: 10, color: theme.text },
    card: { backgroundColor: theme.card, padding: 18, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
    cardLabel: { fontSize: 11, color: theme.textMuted, letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
    cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, color: theme.text },
    cardPrice: { fontSize: 28, fontWeight: 'bold', color: theme.primary, marginBottom: 4 },
    cardValue: { fontSize: 18, fontWeight: '600', marginBottom: 2, color: theme.text },
    cardSub: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
    divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
    fieldLabel: { fontSize: 12, color: theme.textMuted, marginBottom: 2 },
    fieldValue: { fontSize: 16, fontWeight: '500', color: theme.text },
    warningCard: { backgroundColor: isDark ? '#3f1515' : '#fef3c7', borderWidth: 1, borderColor: isDark ? theme.danger : '#f59e0b' },
    warningText: { fontSize: 14, color: isDark ? '#fca5a5' : '#92400e', fontWeight: '500' },
    actions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    button: { flex: 1, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    buttonSecondary: { flex: 1, backgroundColor: theme.card, paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
    buttonSecondaryText: { color: theme.text, fontSize: 16, fontWeight: 'bold' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
    otroVehiculoContainer: { marginTop: 10, padding: 12, backgroundColor: isDark ? '#2a2a2c' : '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: theme.border },
    input: { backgroundColor: theme.background, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, fontSize: 16, marginTop: 8, borderWidth: 1, borderColor: theme.border, color: theme.text },
    vehiculoCard: { padding: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 8, marginRight: 10, backgroundColor: theme.background, minWidth: 140 },
    vehiculoCardSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
    vehiculoTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
    vehiculoSub: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
    textWhite: { color: '#ffffff' },
  });
};
