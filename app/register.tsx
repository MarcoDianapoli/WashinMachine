import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';

export default function RegisterScreen() {
  const router = useRouter();
  const { showToast } = useApp();
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const registrar = () => {
    if (!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showToast('Por favor llena todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden');
      return;
    }

    // Aquí iría la lógica para enviar los datos a una API en el futuro.
    // Por el momento simulamos un registro exitoso local.
    showToast('Cuenta creada exitosamente');
    router.replace('/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear una cuenta nueva</Text>
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginText}>Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Click AQUI</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>NOMBRE</Text>
        <TextInput
          style={styles.input}
          placeholder="Jia Ranjan"
          placeholderTextColor="#aaa"
          value={nombre}
          onChangeText={setNombre}
          textAlign="center"
        />

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="hello@reallygreatsite.com"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign="center"
        />

        <Text style={styles.label}>CONTRASEÑA</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textAlign="center"
        />

        <Text style={styles.label}>REPETIR CONTRASEÑA</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#aaa"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, (!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) && styles.buttonDisabled]}
          onPress={registrar}
          disabled={!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()}
        >
          <Text style={styles.buttonText}>Registrarte</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30, 
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    marginBottom: 10,
    width: '70%',
    lineHeight: 34,
  },
  loginLinkContainer: {
    flexDirection: 'row',
  },
  loginText: {
    fontSize: 13,
    color: '#888',
  },
  loginLink: {
    fontSize: 13,
    color: '#666',
    textDecorationLine: 'underline',
  },
  label: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#999', 
    marginBottom: 8, 
    letterSpacing: 1 
  },
  input: {
    backgroundColor: '#f2f2f2',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 20,
    color: '#333',
  },
  button: { 
    backgroundColor: '#e62222', 
    width: '100%',
    paddingVertical: 16, 
    borderRadius: 6, 
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: { 
    opacity: 0.5 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});
