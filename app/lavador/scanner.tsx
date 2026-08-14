import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';
import { advanceCodeApi } from '@/lib/api';
import { SpeedometerLoader } from '@/components/speedometer-loader';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast, tema } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);
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
        <TouchableOpacity style={styles.requestButton} onPress={requestPermission}>
          <Text style={styles.requestButtonText}>Otorgar permiso</Text>
        </TouchableOpacity>
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
      showToast(err?.message || 'Código QR no válido o cita no encontrada');
      setTimeout(() => { setScanned(false); setLoading(false); }, 2000);
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
        {loading && (
          <View style={styles.processingLoader}>
            <SpeedometerLoader compact size={46} accentColor="#ffffff" trackColor="rgba(255,255,255,0.28)" />
          </View>
        )}
        {scanned && !loading && (
          <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
            <Text style={styles.buttonText}>Toca para escanear de nuevo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  return StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.56)',
    paddingHorizontal: 24,
  },
  scanArea: {
    width: 264,
    height: 264,
    borderWidth: 4,
    borderColor: '#ffffff',
    borderRadius: 28,
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  promptText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: theme.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    overflow: 'hidden',
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: theme.primary,
  },
  buttonText: {
    color: 'white',
    fontWeight: '900',
  },
  processingLoader: { marginTop: 18 },
  requestButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 999,
  },
  requestButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  });
};
