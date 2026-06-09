import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';

export default function LoginScreen() {
  const router = useRouter();
  const { setCliente } = useApp();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');

  const iniciarSesion = () => {
    if (!nombre.trim() || !telefono.trim()) return;
    setCliente({ nombre: nombre.trim(), telefono: telefono.trim(), vehiculo: { placa: '', marca: '', modelo: '', color: '' }, personaRecoge: '', direccion: '', notas: '' });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Autolavado</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          style={styles.input}
          placeholder="Número de contacto"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
        />
        <TouchableOpacity
          style={[styles.button, (!nombre.trim() || !telefono.trim()) && styles.buttonDisabled]}
          onPress={iniciarSesion}
          disabled={!nombre.trim() || !telefono.trim()}
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f5f5f5' },
  content: { paddingHorizontal: 30 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#dc2626' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40, color: '#666' },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: { backgroundColor: '#dc2626', paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
