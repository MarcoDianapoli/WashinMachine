import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { showToast, tema } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);
  
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
          placeholderTextColor={theme.textMuted}
          value={nombre}
          onChangeText={setNombre}
          textAlign="center"
        />

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="hello@reallygreatsite.com"
          placeholderTextColor={theme.textMuted}
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
          placeholderTextColor={theme.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textAlign="center"
        />

        <Text style={styles.label}>REPETIR CONTRASEÑA</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={theme.textMuted}
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

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  return StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.background 
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
      color: theme.text,
      marginBottom: 10,
      width: '70%',
      lineHeight: 34,
    },
    loginLinkContainer: {
      flexDirection: 'row',
    },
    loginText: {
      fontSize: 13,
      color: theme.textMuted,
    },
    loginLink: {
      fontSize: 13,
      color: theme.primary,
      textDecorationLine: 'underline',
    },
    label: { 
      fontSize: 12, 
      fontWeight: 'bold', 
      color: theme.textMuted, 
      marginBottom: 8, 
      letterSpacing: 1 
    },
    input: {
      backgroundColor: theme.card,
      width: '100%',
      paddingVertical: 14,
      borderRadius: 6,
      fontSize: 14,
      marginBottom: 20,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    button: { 
      backgroundColor: theme.primary, 
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
};
