import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';

import { Colors } from '@/constants/Colors';
import { useApp } from '@/store';
import type { Cita, Vehiculo } from '@/types';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const ACTIVE_STATES: Cita['estado'][] = [
  'pendiente',
  'confirmada',
  'en_proceso',
  'listo_entrega',
];

const ESTADO_COLOR: Record<Cita['estado'], string> = {
  pendiente: '#ef3b42',
  confirmada: '#ef3b42',
  en_proceso: '#2563eb',
  listo_entrega: '#a855f7',
  completada: '#16a36f',
  cancelada: '#737373',
};

const ESTADO_LABEL: Record<Cita['estado'], string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  en_proceso: 'En proceso',
  listo_entrega: 'Lista para recoger',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

type AppointmentMode = 'active' | 'all';

interface CustomerAppointmentsScreenProps {
  mode: AppointmentMode;
}

interface AppointmentSection {
  title: string;
  data: Cita[];
}

function dateParts(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return { month: '', day: date };
  const month = MONTHS[Number(match[2]) - 1] ?? '';
  return {
    month: `${month.charAt(0).toUpperCase()}${month.slice(1)} ${match[1]}`,
    day: match[3],
  };
}

function appointmentVehicle(cita: Cita): Vehiculo | undefined {
  return cita.cliente.vehiculo || cita.cliente.vehiculos?.[0];
}

function appointmentTime(cita: Cita) {
  const timestamp = new Date(`${cita.fecha}T${cita.hora.slice(0, 5)}:00`).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortAscending(appointments: Cita[]) {
  return [...appointments].sort((first, second) => appointmentTime(first) - appointmentTime(second));
}

function sortDescending(appointments: Cita[]) {
  return [...appointments].sort((first, second) => appointmentTime(second) - appointmentTime(first));
}

interface AppointmentCardProps {
  item: Cita;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onShowDetails: () => void;
  styles: ReturnType<typeof getStyles>;
}

function AppointmentCard({
  item,
  index,
  expanded,
  onToggle,
  onShowDetails,
  styles,
}: AppointmentCardProps) {
  const { month, day } = dateParts(item.fecha);
  const vehicle = appointmentVehicle(item);
  const vehicleName = [vehicle?.marca, vehicle?.modelo].filter(Boolean).join(' ') || 'Vehículo registrado';
  const statusColor = ESTADO_COLOR[item.estado];

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 5) * 70).springify()}>
      <View style={styles.card}>
        <TouchableOpacity
          onPress={onToggle}
          activeOpacity={0.86}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`${expanded ? 'Contraer' : 'Expandir'} cita de ${item.paqueteNombre} del ${item.fecha}`}
        >
          <View style={styles.cardDatePanel}>
            <View style={styles.dateContent}>
              <Text style={styles.cardMonth}>{month}</Text>
              <Text style={styles.cardDay}>{day}</Text>
              <Text style={styles.cardTime}>{item.hora}</Text>
            </View>
            <View style={styles.collapseIcon}>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#ffffff" />
            </View>
          </View>

          <View style={styles.cardSummary}>
            <View style={styles.cardSummaryText}>
              <Text style={styles.cardTitle}>{item.paqueteNombre}</Text>
              <Text style={styles.cardVehicle} numberOfLines={1}>
                {[vehicleName, item.vehiculo?.tipoVehiculo ? `(${item.vehiculo.tipoVehiculo})` : null].filter(Boolean).join(' ')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[styles.status, { borderColor: statusColor }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{ESTADO_LABEL[item.estado]}</Text>
              </View>
              {item.paid ? (
                <View style={[styles.status, { borderColor: '#16a34a' }]}>
                  <Text style={[styles.statusText, { color: '#16a34a' }]}>Pagado ✓</Text>
                </View>
              ) : item.precio !== undefined && item.estado !== 'completada' && item.estado !== 'cancelada' ? (
                <View style={[styles.status, { borderColor: '#f59e0b' }]}>
                  <Text style={[styles.statusText, { color: '#f59e0b' }]}>Por pagar</Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>

        {expanded && (
          <Animated.View entering={FadeInUp.duration(180)} style={styles.cardExpanded}>
            <View style={styles.chips}>
              {!!vehicle?.placa && <Text style={styles.chip}>{vehicle.placa.toUpperCase()}</Text>}
              {!!item.duracion && <Text style={styles.chip}>{item.duracion}</Text>}
              {item.precio !== undefined && <Text style={styles.chip}>${item.precio}</Text>}
            </View>

            {!!item.code && (
              <View style={styles.codeRow}>
                <Text style={styles.codeLabel}>FOLIO</Text>
                <Text style={styles.cardCode}>{item.code}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.detailsButton} onPress={onShowDetails} activeOpacity={0.82}>
              <Text style={styles.detailsButtonText}>
                {item.estado === 'completada' || item.estado === 'cancelada'
                  ? 'Ver detalles'
                  : 'Ver QR y detalles'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

export function CustomerAppointmentsScreen({ mode }: CustomerAppointmentsScreenProps) {
  const router = useRouter();
  const { citas, cancelarCita, syncAppointments, authUser, cliente, tema, paymentsEnabled, paquetes } = useApp();
  const styles = useMemo(() => getStyles(tema), [tema]);
  const [selected, setSelected] = useState<Cita | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeAppointments = useMemo(
    () => sortAscending(citas.filter((cita) => ACTIVE_STATES.includes(cita.estado))),
    [citas],
  );
  const completedAppointments = useMemo(
    () => sortDescending(citas.filter((cita) => cita.estado === 'completada')),
    [citas],
  );
  const cancelledAppointments = useMemo(
    () => sortDescending(citas.filter((cita) => cita.estado === 'cancelada')),
    [citas],
  );

  const sections = useMemo<AppointmentSection[]>(() => {
    if (mode === 'active') {
      return activeAppointments.length > 0
        ? [{ title: 'PRÓXIMAS Y ACTIVAS', data: activeAppointments }]
        : [];
    }

    return [
      { title: 'PRÓXIMAS Y ACTIVAS', data: activeAppointments },
      { title: 'COMPLETADAS', data: completedAppointments },
      { title: 'CANCELADAS', data: cancelledAppointments },
    ].filter((section) => section.data.length > 0);
  }, [activeAppointments, cancelledAppointments, completedAppointments, mode]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await syncAppointments();
    } finally {
      setRefreshing(false);
    }
  };

  const toggleAppointment = (id: string) => {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  };

  const confirmCancel = () => {
    if (!selected) return;
    Alert.alert(
      'Cancelar cita',
      `¿Estás seguro de cancelar la cita del ${selected.fecha} a las ${selected.hora}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await cancelarCita(selected.id);
              setSelected(null);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const canCancel = selected?.estado === 'pendiente' || selected?.estado === 'confirmada';
  const showQr = selected && selected.estado !== 'completada' && selected.estado !== 'cancelada';
  const selectedVehicle = selected ? appointmentVehicle(selected) : undefined;
  const selectedStatusColor = selected ? ESTADO_COLOR[selected.estado] : ESTADO_COLOR.pendiente;
  const isHistory = mode === 'all';

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <View style={styles.headingRow}>
          {isHistory && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Volver al perfil"
            >
              <Ionicons name="arrow-back" size={22} color={styles.backIcon.color} />
            </TouchableOpacity>
          )}
          <View style={styles.headingText}>
            <Text style={styles.eyebrow}>{isHistory ? 'HISTORIAL' : 'AGENDA'}</Text>
            <Text style={[styles.title, isHistory && styles.historyTitle]}>
              {isHistory ? 'Todas mis citas' : 'Mis citas'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.headerButtonText}>+ Agendar</Text>
        </TouchableOpacity>
      </Animated.View>

      {sections.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {isHistory ? 'Tu historial está vacío' : 'No tienes citas próximas'}
          </Text>
          <Text style={styles.emptyText}>
            {isHistory
              ? 'Cuando agendes o completes un servicio, aparecerá aquí.'
              : 'Las citas completadas y canceladas siguen disponibles en Perfil → Mis Citas.'}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.primaryButtonText}>Agendar cita</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(cita) => cita.id}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={refreshing}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{String(section.data.length).padStart(2, '0')}</Text>
            </View>
          )}
          renderItem={({ item, index }) => (
            <View style={styles.cardSpacing}>
              <AppointmentCard
                item={item}
                index={index}
                expanded={!!expandedIds[item.id]}
                onToggle={() => toggleAppointment(item.id)}
                onShowDetails={() => setSelected(item)}
                styles={styles}
              />
            </View>
          )}
          SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
          ListFooterComponent={(
            <View>
              {activeAppointments.length > 0 && (
                <Text style={styles.note}>CANCELA O REAGENDA HASTA 3 H ANTES</Text>
              )}
              <TouchableOpacity style={styles.liveIndicator} onPress={refresh}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Actualización en vivo</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selected && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selected.paqueteNombre}</Text>
                    <TouchableOpacity onPress={() => setSelected(null)}>
                      <Text style={styles.modalClose}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.status, { borderColor: selectedStatusColor, alignSelf: 'flex-start' }]}>
                    <Text style={[styles.statusText, { color: selectedStatusColor }]}>
                      {ESTADO_LABEL[selected.estado]}
                    </Text>
                  </View>

                  {paymentsEnabled && selected && !selected.paid && selected.estado !== 'completada' && selected.estado !== 'cancelada' && (
                    <TouchableOpacity
                      style={styles.payOnlineButton}
                      onPress={() => {
                        const pkg = paquetes.find(p => p.id === selected.paqueteId);
                        const displayPrice = selected.precio !== undefined ? selected.precio : (pkg?.precio || 0);
                        setSelected(null);
                        router.push({
                          pathname: '/pago',
                          params: {
                            appointmentId: selected.id,
                            precio: String(displayPrice),
                            paqueteNombre: selected.paqueteNombre,
                            fecha: selected.fecha,
                            hora: selected.hora,
                          },
                        });
                      }}
                    >
                      <Text style={styles.payOnlineButtonText}>Pagar en línea</Text>
                    </TouchableOpacity>
                  )}

                  {showQr && selected.code && (
                    <View style={styles.ticket}>
                      <View style={styles.ticketStrip} />
                      <View style={styles.ticketBody}>
                        <Text style={styles.qrLabel}>CÓDIGO DE ENTREGA</Text>
                        <View style={styles.qrGraphic}>
                          <QRCode value={selected.code} size={176} color="#000000" backgroundColor="#ffffff" />
                        </View>
                        <Text style={styles.qrCode}>{selected.code}</Text>
                      </View>
                      <Text style={styles.qrHint}>Muéstralo al lavador para entregar y recoger tu auto.</Text>
                    </View>
                  )}

                  <DetailRow label="Fecha" value={selected.fecha} styles={styles} />
                  <DetailRow label="Hora" value={selected.hora} styles={styles} />
                  <DetailRow 
                    label="Precio" 
                    value={selected.precio !== undefined ? `$${selected.precio}` : (paquetes.find(p => p.id === selected.paqueteId)?.precio || '$0')} 
                    styles={styles} 
                  />
                  <DetailRow
                    label="Cliente"
                    value={selected.cliente.nombre || authUser?.nombre || cliente?.nombre || 'Cliente'}
                    styles={styles}
                  />
                  <DetailRow
                    label="Teléfono"
                    value={selected.cliente.telefono || authUser?.telefono || cliente?.telefono || 'No registrado'}
                    styles={styles}
                  />
                  <DetailRow
                    label="Vehículo"
                    value={
                      [
                        [selectedVehicle?.marca, selectedVehicle?.modelo, selectedVehicle?.placa]
                          .filter(Boolean)
                          .join(' · ') || 'Vehículo',
                        selectedVehicle?.tipoVehiculo ? `(${selectedVehicle.tipoVehiculo})` : null
                      ].filter(Boolean).join(' ')
                    }
                    styles={styles}
                  />
                  {!!selected.washerName && (
                    <DetailRow label="Lavador" value={selected.washerName} styles={styles} />
                  )}
                  <DetailRow
                    label="Pago"
                    value={selected.paid ? 'Pagado ✓' : 'Por pagar'}
                    styles={styles}
                  />

                  {canCancel && (
                    <TouchableOpacity
                      style={[styles.cancelButton, busy && styles.disabledButton]}
                      onPress={confirmCancel}
                      disabled={busy}
                    >
                      <Text style={styles.cancelButtonText}>{busy ? 'Cancelando…' : 'Cancelar cita'}</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  styles: ReturnType<typeof getStyles>;
}

function DetailRow({ label, value, styles }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  const isDark = tema === 'oscuro';
  const ink = isDark ? '#f4f3f1' : '#000000';
  const surface = isDark ? '#151518' : '#ffffff';
  const muted = isDark ? '#a3a3aa' : '#737373';
  const line = isDark ? '#33333a' : '#d6d6d6';
  const cardAccent = isDark ? theme.primary : '#111111';
  const cardBorder = isDark ? line : '#111111';
  const buttonBackground = isDark ? theme.primary : '#111111';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 18 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 12,
      paddingTop: 28,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: line,
    },
    headingRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headingText: { flex: 1, minWidth: 0 },
    eyebrow: { fontSize: 10, letterSpacing: 2.8, color: muted, fontWeight: '700' },
    title: { fontSize: 44, lineHeight: 48, fontWeight: '900', letterSpacing: -1.5, color: ink },
    historyTitle: { fontSize: 34, lineHeight: 39 },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#242428' : '#eeeeee',
    },
    backIcon: { color: ink },
    headerButton: {
      backgroundColor: buttonBackground,
      paddingHorizontal: 17,
      paddingVertical: 12,
      borderRadius: 999,
      marginBottom: 4,
    },
    headerButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
    list: { paddingTop: 24, paddingBottom: 48 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 12,
    },
    sectionTitle: { color: muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
    sectionCount: { color: theme.primary, fontSize: 11, fontWeight: '900' },
    sectionSeparator: { height: 24 },
    cardSpacing: { marginBottom: 16 },
    card: {
      borderWidth: isDark ? 1.5 : 1,
      borderColor: cardBorder,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: surface,
    },
    cardDatePanel: {
      backgroundColor: cardAccent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    dateContent: { flexDirection: 'row', alignItems: 'baseline', gap: 14 },
    cardMonth: { color: 'rgba(255,255,255,0.72)', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' },
    cardDay: { color: '#ffffff', fontSize: 36, lineHeight: 39, fontWeight: '900' },
    cardTime: { color: isDark ? '#ffffff' : '#ff5a60', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
    collapseIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.18)',
    },
    cardSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 18,
    },
    cardSummaryText: { flex: 1, minWidth: 0, gap: 5 },
    cardTitle: { color: ink, fontSize: 23, lineHeight: 27, fontWeight: '900', letterSpacing: -0.4 },
    cardVehicle: { color: isDark ? '#b6b6bd' : '#575757', fontSize: 13, lineHeight: 18 },
    cardExpanded: {
      borderTopWidth: 1,
      borderTopColor: line,
      borderStyle: 'dashed',
      padding: 18,
      paddingTop: 15,
      gap: 15,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      color: isDark ? '#d8d8dd' : '#2b2b2b',
      borderWidth: 1,
      borderColor: isDark ? '#4a2629' : '#d0d0d0',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 10,
      letterSpacing: 0.8,
    },
    codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    codeLabel: { color: muted, fontSize: 9, letterSpacing: 1.5, fontWeight: '800' },
    cardCode: { color: ink, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
    detailsButton: {
      backgroundColor: theme.primary,
      borderRadius: 999,
      paddingHorizontal: 18,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    detailsButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
    status: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, maxWidth: 132 },
    statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.45, textTransform: 'uppercase', textAlign: 'center' },
    note: { color: muted, fontSize: 9, letterSpacing: 1.4, textAlign: 'center', marginTop: 4 },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a', marginRight: 7 },
    liveText: { color: muted, fontSize: 11 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 8 },
    emptyTitle: { color: ink, fontSize: 36, lineHeight: 39, fontWeight: '900', letterSpacing: -1 },
    emptyText: { color: isDark ? '#b6b6bd' : '#575757', fontSize: 16, lineHeight: 25, marginTop: 14, marginBottom: 28 },
    primaryButton: { backgroundColor: theme.primary, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 15 },
    primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
    modalContent: {
      maxHeight: '92%',
      backgroundColor: surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
    },
    modalHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: line, alignSelf: 'center', marginTop: 10 },
    modalScroll: { padding: 22, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 },
    modalTitle: { color: ink, flex: 1, fontSize: 28, lineHeight: 32, fontWeight: '900' },
    modalClose: { color: theme.primary, fontSize: 14, fontWeight: '700', paddingVertical: 5 },
    ticket: { borderWidth: 1, borderColor: isDark ? line : ink, borderRadius: 20, overflow: 'hidden', marginVertical: 22 },
    ticketStrip: { height: 12, backgroundColor: theme.primary },
    ticketBody: { alignItems: 'center', padding: 22, gap: 14 },
    qrLabel: { color: muted, fontSize: 10, letterSpacing: 2.1, fontWeight: '700' },
    qrGraphic: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e3e3e3' },
    qrCode: { color: ink, fontSize: 16, fontWeight: '800', letterSpacing: 3.5, textAlign: 'center' },
    qrHint: { color: muted, fontSize: 11, lineHeight: 17, textAlign: 'center', borderTopWidth: 1, borderTopColor: line, borderStyle: 'dashed', padding: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: line },
    detailLabel: { color: muted, fontSize: 13 },
    detailValue: { color: ink, flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '700' },
    cancelButton: { marginTop: 26, borderRadius: 999, backgroundColor: theme.primary, alignItems: 'center', paddingVertical: 15 },
    cancelButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
    payOnlineButton: { marginTop: 12, borderRadius: 999, backgroundColor: '#2563eb', alignItems: 'center', paddingVertical: 15 },
    payOnlineButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
    disabledButton: { opacity: 0.55 },
  });
};
