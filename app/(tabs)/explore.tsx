import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, BounceIn } from 'react-native-reanimated';
import { useApp } from '@/store';
import type { PaqueteConTamano } from '@/store';

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

function PaqueteCard({ item, index, onPress }: { item: PaqueteConTamano; index: number; onPress: (p: PaqueteConTamano) => void }) {
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
  const { tamanoVehiculo, vehicleTypeLabel, paquetes } = useApp();
  const [detallePaquete, setDetallePaquete] = useState<PaqueteConTamano | null>(null);

  const seleccionarPaquete = (paquete: PaqueteConTamano) => {
    setDetallePaquete(paquete);
  };

  const crearCita = () => {
    if (!detallePaquete) return;
    router.push({ pathname: '/horarios', params: { paqueteId: detallePaquete.id } });
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()}>
        <Text style={styles.title}>Selecciona un paquete</Text>
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
          <PaqueteCard item={item} index={index} onPress={seleccionarPaquete} />
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  list: { gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: 'white', padding: 20, borderRadius: 10, elevation: 2,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  cardBadge: { backgroundColor: '#dc2626', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSub: { fontSize: 14, color: '#666' },
  cardArrow: { fontSize: 24, color: '#ccc', fontWeight: '300' },
  hintBox: { backgroundColor: '#fee2e2', padding: 14, borderRadius: 10, marginBottom: 16 },
  hintLabel: { fontSize: 14, fontWeight: '600', color: '#991b1b' },
  hintType: { fontSize: 12, color: '#dc2626', marginTop: 4 },
  hintSmall: { fontSize: 11, color: '#fca5a5', marginTop: 4 },
  footer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  volverButton: { backgroundColor: 'white', paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  volverText: { fontSize: 16, fontWeight: '600', color: '#333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  modalBadgeText: { fontSize: 12, fontWeight: '700', color: '#991b1b' },
  modalClose: { fontSize: 16, color: '#dc2626', fontWeight: '600' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  detailLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  detailValue: { fontSize: 16, color: '#111', fontWeight: '600' },
  detailPrice: { fontSize: 22, color: '#dc2626', fontWeight: 'bold' },
  detailDesc: { marginTop: 20, marginBottom: 24 },
  descText: { fontSize: 14, color: '#555', lineHeight: 22, marginTop: 6 },
  selectButton: { backgroundColor: '#dc2626', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  selectButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { paddingVertical: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, color: '#666', fontWeight: '500' },
});
