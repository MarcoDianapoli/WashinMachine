import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useApp } from '@/store';
import type { Vehiculo } from '@/types';
import { Colors } from '@/constants/Colors';
import { SpeedometerLoader } from '@/components/speedometer-loader';

const TAMANO_TO_API_TYPE: Record<string, string> = {
  chico: 'small',
  mediano: 'medium',
  grande: 'large',
  moto: 'motorcycle',
  trailer: 'trailer',
};

export default function ConfirmarCitaScreen() {
  const { paqueteId, fecha, hora } = useLocalSearchParams<{
    paqueteId: string;
    fecha: string;
    hora: string;
  }>();
  const router = useRouter();
  const { paquetes, cliente, authUser, crearCitaApiCall, syncAppointments, showToast, tema, paymentsEnabled } = useApp();
  const styles = useMemo(() => getStyles(tema), [tema]);
  const theme = Colors[tema];

  const paquete = paquetes.find((p) => p.id === paqueteId);

  const misVehiculos = cliente?.vehiculos || [];
  const tieneVehiculoRegistrado = misVehiculos.length > 0;
  
  const [vehiculoSeleccionadoIdx, setVehiculoSeleccionadoIdx] = useState<number>(tieneVehiculoRegistrado ? 0 : -1);
  const [usarOtroVehiculo, setUsarOtroVehiculo] = useState(!tieneVehiculoRegistrado);
  const [otroModelo, setOtroModelo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSwitch = (val: boolean) => {
    setUsarOtroVehiculo(val);
    if (val) {
      setVehiculoSeleccionadoIdx(-1);
    } else if (tieneVehiculoRegistrado) {
      setVehiculoSeleccionadoIdx(0);
    }
  };

  const confirmarCita = async () => {
    if (!authUser && !cliente) {
      Alert.alert('Sesión requerida', 'Para guardar tus citas en la base de datos debes iniciar sesión.', [
        { text: 'Iniciar Sesión', onPress: () => router.replace('/login') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
      return;
    }

    if (!paquete || !fecha || !hora) return;

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

    const vehicleTypeApi = TAMANO_TO_API_TYPE[paquete.tamano] || 'medium';

    setLoading(true);
    try {
      const res = await crearCitaApiCall({
        packageId: paquete.id,
        date: fecha,
        time: hora,
        customer: {
          name: authUser?.nombre || cliente?.nombre,
          phone: authUser?.telefono || cliente?.telefono,
          pickupPerson: cliente?.personaRecoge || authUser?.pickupPerson || undefined,
        },
        vehicle: {
          plate: vehiculoCita.placa || undefined,
          make: vehiculoCita.marca || 'Vehículo',
          model: vehiculoCita.modelo || undefined,
          color: vehiculoCita.color || undefined,
          year: vehiculoCita.anio || undefined,
          vehicleType: vehicleTypeApi,
        },
        notes: cliente?.notas || undefined,
      });

      await syncAppointments();
      showToast('Cita creada exitosamente en la base de datos');
      
      const finalPriceStr = res?.price !== undefined ? String(res.price) : paquete?.precio;
      const parsedPrice = parseFloat((finalPriceStr || '0').replace('$', ''));
      
      if (paymentsEnabled && parsedPrice > 0) {
        router.replace({
          pathname: '/pago',
          params: {
            appointmentId: res._id,
            precio: finalPriceStr || '0',
            paqueteNombre: res.packageName || paquete?.nombre || '',
            fecha: fecha,
            hora: hora,
          },
        });
      } else {
        router.replace('/exito');
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'No se pudo agendar en la base de datos';
      showToast(errorMsg);

      if (errorMsg.toLowerCase().includes('token') || errorMsg.toLowerCase().includes('unauthorized')) {
        Alert.alert('Sesión requerida', 'Debes iniciar sesión con tu cuenta para guardar la cita en la base de datos.', [
          { text: 'Iniciar Sesión', onPress: () => router.replace('/login') },
          { text: 'Cancelar', style: 'cancel' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const nombreMostrar = authUser?.nombre || cliente?.nombre;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.springify()}>
        <Text style={styles.eyebrow}>RESERVA · PASO 2 DE 2</Text>
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

      {nombreMostrar ? (
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>CLIENTE</Text>
            <Text style={styles.cardValue}>{nombreMostrar}</Text>
            <View style={styles.divider} />
            <Text style={styles.fieldLabel}>Teléfono</Text>
            <Text style={styles.fieldValue}>{authUser?.telefono || cliente?.telefono || 'No registrado'}</Text>
            
            <View style={styles.divider} />
            <Text style={styles.cardLabel}>VEHÍCULO A LAVAR</Text>
            
            {tieneVehiculoRegistrado && !usarOtroVehiculo && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
                {misVehiculos.map((v, i) => {
                  const isSelected = i === vehiculoSeleccionadoIdx;
                  return (
                    <TouchableOpacity 
                      key={v._id || i} 
                      onPress={() => setVehiculoSeleccionadoIdx(i)}
                      style={[styles.vehiculoCard, isSelected && styles.vehiculoCardSelected]}
                    >
                      <Text style={[styles.vehiculoTitle, isSelected && styles.textWhite]}>
                        {[v.marca, v.modelo, v.tipoVehiculo ? `(${v.tipoVehiculo})` : null].filter(Boolean).join(' ')}
                      </Text>
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

            {(cliente?.personaRecoge || authUser?.pickupPerson) ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.fieldLabel}>Persona que recoge</Text>
                <Text style={styles.fieldValue}>{authUser?.pickupPerson || cliente?.personaRecoge}</Text>
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
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.back()} disabled={loading}>
          <Text style={styles.buttonSecondaryText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, (!nombreMostrar || loading) && styles.buttonDisabled]}
          onPress={confirmarCita}
          disabled={!nombreMostrar || loading}
        >
          {loading ? (
            <SpeedometerLoader compact size={28} accentColor="#ffffff" trackColor="rgba(255,255,255,0.28)" />
          ) : (
            <Text style={styles.buttonText}>Confirmar cita</Text>
          )}
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
    content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 40 },
    eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.3, color: theme.textMuted },
    title: { fontSize: 38, lineHeight: 43, fontWeight: '900', letterSpacing: -1.2, marginBottom: 20, marginTop: 3, color: theme.text },
    card: { backgroundColor: theme.card, padding: 19, borderRadius: 20, marginBottom: 14, borderWidth: isDark ? 1.5 : 1, borderColor: theme.borderStrong },
    cardLabel: { fontSize: 10, fontWeight: '800', color: theme.textMuted, letterSpacing: 1.8, marginBottom: 8, marginTop: 4 },
    cardTitle: { fontSize: 22, fontWeight: '900', marginBottom: 4, color: theme.text },
    cardPrice: { fontSize: 30, fontWeight: '900', color: theme.primary, marginBottom: 4 },
    cardValue: { fontSize: 18, fontWeight: '600', marginBottom: 2, color: theme.text },
    cardSub: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
    divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
    fieldLabel: { fontSize: 12, color: theme.textMuted, marginBottom: 2 },
    fieldValue: { fontSize: 16, fontWeight: '500', color: theme.text },
    warningCard: { backgroundColor: isDark ? '#3f1515' : '#fef3c7', borderWidth: 1, borderColor: isDark ? theme.danger : '#f59e0b' },
    warningText: { fontSize: 14, color: isDark ? '#fca5a5' : '#92400e', fontWeight: '500' },
    actions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    button: { flex: 1, backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 999, alignItems: 'center' },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    buttonSecondary: { flex: 1, backgroundColor: theme.card, paddingVertical: 16, borderRadius: 999, alignItems: 'center', borderWidth: 1, borderColor: theme.borderStrong },
    buttonSecondaryText: { color: theme.text, fontSize: 16, fontWeight: 'bold' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
    otroVehiculoContainer: { marginTop: 10, padding: 14, backgroundColor: theme.surfaceMuted, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
    input: { backgroundColor: theme.background, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 14, fontSize: 16, marginTop: 8, borderWidth: 1, borderColor: theme.borderStrong, color: theme.text },
    vehiculoCard: { padding: 14, borderWidth: 1, borderColor: theme.borderStrong, borderRadius: 16, marginRight: 10, backgroundColor: theme.background, minWidth: 140 },
    vehiculoCardSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
    vehiculoTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
    vehiculoSub: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
    textWhite: { color: '#ffffff' },
  });
};
