import { useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
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

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    const idCita = data.trim();
    const cita = citas.find(c => c.id === idCita);

    if (!cita) {
      showToast('Cita no encontrada');
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    if (cita.estado !== 'listo_entrega') {
      showToast(`La cita está en estado: ${cita.estado}`);
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    entregarCita(cita.id);
    showToast('Auto entregado correctamente');
    router.back();
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
        <Text style={styles.promptText}>Apunta al código QR del cliente</Text>
        {scanned && (
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
