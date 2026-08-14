import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, BounceIn } from 'react-native-reanimated';
import { useApp } from '@/store';
import type { PaqueteConTamano } from '@/store';
import { Colors } from '@/constants/Colors';

const TAMANO_LABEL: Record<string, string> = {
  chico: '🚗 Para autos chicos (sedans, hatchbacks)',
  mediano: '🚙 Para SUVs y crossovers',
  grande: '🛻 Para camionetas y vans',
  moto: '🏍️ Para motocicletas',
  trailer: '🚛 Para trailers y remolques',
};

const TAMANO_NOMBRE: Record<string, string> = {
  chico: 'S — Chico',
  mediano: 'M — Mediano',
  grande: 'L — Grande',
  moto: '🏍️ Moto',
  trailer: '🚛 Trailer',
};

function PaqueteCard({ item, index, onPress, theme, styles }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 120).springify()}>
      <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.85}>
        <View style={styles.cardBadge}>
          <Text style={styles.badgeText}>{item.tamano === 'moto' ? '🏍️' : item.tamano === 'trailer' ? '🚛' : item.tamano === 'chico' ? 'S' : item.tamano === 'mediano' ? 'M' : 'L'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardSub}>{item.duracion} • {item.precio}</Text>
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PaquetesScreen() {
  const router = useRouter();
  const { tamanoVehiculo, vehicleTypeLabel, paquetes, tema } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);
  
  const [detallePaquete, setDetallePaquete] = useState<PaqueteConTamano | null>(null);

  const seleccionarPaquete = (paquete: PaqueteConTamano) => {
    setDetallePaquete(paquete);
  };

  const crearCita = () => {
    if (!detallePaquete) return;
    setDetallePaquete(null); // Fix: close the modal first
    router.push({ pathname: '/horarios', params: { paqueteId: detallePaquete.id } });
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()}>
        <Text style={styles.eyebrow}>SERVICIOS</Text>
        <Text style={styles.title}>Elige tu paquete</Text>
        <Text style={styles.subtitle}>Un formato claro para cada tipo de vehículo.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <View style={styles.hintBox}>
          <Text style={styles.hintLabel}>{TAMANO_LABEL[tamanoVehiculo]}</Text>
          {vehicleTypeLabel && <Text style={styles.hintType}>Tipo detectado: {vehicleTypeLabel}</Text>}
          <Text style={styles.hintSmall}>Configura o cambia tu vehículo en la pestaña Perfil</Text>
        </View>
      </Animated.View>

      <FlatList
        data={paquetes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <PaqueteCard item={item} index={index} onPress={seleccionarPaquete} theme={theme} styles={styles} />
        )}
      />

      <Animated.View entering={BounceIn.delay(400).springify()} style={styles.footer}>
        <TouchableOpacity
          style={styles.volverButton}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.volverText}>← Volver a Mis Citas</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={!!detallePaquete} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {detallePaquete && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalBadge}>
                      <Text style={styles.modalBadgeText}>
                        {TAMANO_NOMBRE[detallePaquete.tamano]}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setDetallePaquete(null)}>
                      <Text style={styles.modalClose}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalTitle}>{detallePaquete.nombre}</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duración</Text>
                    <Text style={styles.detailValue}>{detallePaquete.duracion}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Precio</Text>
                    <Text style={styles.detailPrice}>{detallePaquete.precio}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tamaño</Text>
                    <Text style={styles.detailValue}>{TAMANO_NOMBRE[detallePaquete.tamano]}</Text>
                  </View>

                  <View style={styles.detailDesc}>
                    <Text style={styles.detailLabel}>Descripción</Text>
                    <Text style={styles.descText}>
                      Lavado profesional para vehículos tamaño {detallePaquete.tamano}.
                      Incluye {detallePaquete.nombre.toLowerCase()} con los mejores productos
                      para el cuidado de tu auto.
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.selectButton} onPress={crearCita}>
                    <Text style={styles.selectButtonText}>Seleccionar paquete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelButton} onPress={() => setDetallePaquete(null)}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  const isDark = tema === 'oscuro';
  const strongBorder = theme.borderStrong;
  
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 18, paddingTop: 28, backgroundColor: theme.background },
    eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.8, color: theme.textMuted },
    title: { fontSize: 42, lineHeight: 46, fontWeight: '900', letterSpacing: -1.4, marginTop: 2, color: theme.text },
    subtitle: { fontSize: 14, lineHeight: 20, color: theme.textMuted, marginTop: 7, marginBottom: 18 },
    list: { gap: 14, paddingBottom: 110 },
    card: {
      backgroundColor: theme.card, padding: 18, borderRadius: 20,
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderWidth: isDark ? 1.5 : 1, borderColor: strongBorder,
    },
    cardBadge: { backgroundColor: theme.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    badgeText: { color: theme.onPrimary, fontWeight: '900', fontSize: 14 },
    cardTitle: { fontSize: 19, lineHeight: 23, fontWeight: '900', color: theme.text },
    cardSub: { fontSize: 13, color: theme.textMuted, marginTop: 4 },
    cardArrow: { fontSize: 28, color: theme.primary, fontWeight: '500' },
    hintBox: { backgroundColor: theme.primarySoft, padding: 15, borderRadius: 16, marginBottom: 16 },
    hintLabel: { fontSize: 14, fontWeight: '800', color: isDark ? '#ffb4b8' : '#991b1b' },
    hintType: { fontSize: 12, color: theme.primary, marginTop: 4 },
    hintSmall: { fontSize: 11, color: theme.textMuted, marginTop: 4 },
    footer: { position: 'absolute', bottom: 18, left: 18, right: 18 },
    volverButton: { backgroundColor: isDark ? theme.primary : '#111111', paddingVertical: 14, borderRadius: 999, alignItems: 'center', borderWidth: 1, borderColor: strongBorder },
    volverText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '84%', padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalBadge: { backgroundColor: theme.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
    modalBadgeText: { fontSize: 12, fontWeight: '700', color: isDark ? '#fca5a5' : '#991b1b' },
    modalClose: { fontSize: 16, color: theme.danger, fontWeight: '600' },
    modalTitle: { fontSize: 30, lineHeight: 34, fontWeight: '900', letterSpacing: -0.7, marginBottom: 24, color: theme.text },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
    detailLabel: { fontSize: 14, color: theme.textMuted, fontWeight: '500' },
    detailValue: { fontSize: 16, color: theme.text, fontWeight: '600' },
    detailPrice: { fontSize: 22, color: theme.primary, fontWeight: 'bold' },
    detailDesc: { marginTop: 20, marginBottom: 24 },
    descText: { fontSize: 14, color: theme.textMuted, lineHeight: 22, marginTop: 6 },
    selectButton: { backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 999, alignItems: 'center', marginBottom: 12 },
    selectButtonText: { color: 'white', fontSize: 16, fontWeight: '900' },
    cancelButton: { paddingVertical: 12, alignItems: 'center' },
    cancelButtonText: { fontSize: 16, color: theme.textMuted, fontWeight: '500' },
  });
};
