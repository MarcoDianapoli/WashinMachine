import { useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';
import { resolveCodeApi, advanceCodeApi } from '@/lib/api';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const { citas, entregarCita, showToast, tema } = useApp();
  const theme = Colors[tema];
  const router = useRouter();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ textAlign: 'center', color: theme.text, marginBottom: 20 }}>
          Necesitamos tu permiso para usar la cámara
        </Text>
        <Button onPress={requestPermission} title="Otorgar Permiso" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    const code = data.trim();

    try {
      // Try resolving code via API
      const res = await advanceCodeApi(code);
      let msg = 'Cita avanzada correctamente';
      if (res.status === 'in_progress') msg = 'Cita tomada en proceso';
      else if (res.status === 'ready_for_pickup') msg = 'Auto listo para entrega';
      else if (res.status === 'completed') msg = 'Auto entregado al cliente';

      showToast(msg);
      router.back();
    } catch (err: any) {
      // Fallback local logic if offline/test
      const idCita = code;
      const cita = citas.find(c => c.id === idCita || c.code === idCita);

      if (!cita) {
        showToast(err?.message || 'Código QR no válido o cita no encontrada');
        setTimeout(() => { setScanned(false); setLoading(false); }, 2000);
        return;
      }

      if (cita.estado !== 'listo_entrega' && cita.estado !== 'confirmada' && cita.estado !== 'pendiente') {
        showToast(`La cita está en estado: ${cita.estado}`);
        setTimeout(() => { setScanned(false); setLoading(false); }, 2000);
        return;
      }

      entregarCita(cita.id);
      showToast('Auto entregado correctamente');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.promptText}>
          {loading ? 'Procesando código...' : 'Apunta al código QR del cliente'}
        </Text>
        {loading && <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 16 }} />}
        {scanned && !loading && (
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => setScanned(false)}>
            <Text style={styles.buttonText}>Toca para escanear de nuevo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00ff00',
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  promptText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
  },
  button: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
