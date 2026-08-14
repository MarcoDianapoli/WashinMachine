import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';
import { SpeedometerLoader } from '@/components/speedometer-loader';

export default function RegisterScreen() {
  const router = useRouter();
  const { registerWithEmail, showToast, tema } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const registrar = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showToast('Por favor llena todos los campos obligatorios');
      return;
    }
    if (password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(nombre.trim(), email.trim().toLowerCase(), password, telefono.trim() || undefined);
      showToast('Cuenta creada exitosamente');
      router.replace('/(tabs)');
    } catch (err: any) {
      const errorText = err?.message || (typeof err === 'string' ? err : 'Error al registrar cuenta');
      showToast(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>NUEVO CLIENTE</Text>
          <Text style={styles.title}>Crear una cuenta nueva</Text>
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Haz click AQUÍ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>NOMBRE COMPLETO</Text>
        <TextInput
          style={styles.input}
          placeholder="Juan Pérez"
          placeholderTextColor={theme.textMuted}
          value={nombre}
          onChangeText={setNombre}
          textAlign="center"
        />

        <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
        <TextInput
          style={styles.input}
          placeholder="juan@ejemplo.com"
          placeholderTextColor={theme.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign="center"
        />

        <Text style={styles.label}>TELÉFONO (OPCIONAL)</Text>
        <TextInput
          style={styles.input}
          placeholder="3312345678"
          placeholderTextColor={theme.textMuted}
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          textAlign="center"
        />

        <Text style={styles.label}>CONTRASEÑA</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 6 caracteres"
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
          style={[styles.button, (!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || loading) && styles.buttonDisabled]}
          onPress={registrar}
          disabled={!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || loading}
        >
          {loading ? (
            <SpeedometerLoader compact size={28} accentColor="#ffffff" trackColor="rgba(255,255,255,0.28)" />
          ) : (
            <Text style={styles.buttonText}>Registrarte</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  const isDark = tema === 'oscuro';
  return StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.background 
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 28,
    },
    eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.6, color: theme.primary, marginBottom: 5 },
    title: {
      fontSize: 36,
      lineHeight: 40,
      fontWeight: '900',
      letterSpacing: -1.1,
      textAlign: 'center',
      color: theme.text,
      marginBottom: 10,
      width: '95%',
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
      fontWeight: 'bold',
    },
    label: { 
      fontSize: 12, 
      fontWeight: 'bold', 
      color: theme.textMuted, 
      marginBottom: 6, 
      letterSpacing: 1 
    },
    input: {
      backgroundColor: theme.card,
      width: '100%',
      paddingVertical: 14,
      borderRadius: 16,
      fontSize: 14,
      marginBottom: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: isDark ? theme.borderStrong : theme.border,
    },
    button: { 
      backgroundColor: theme.primary, 
      width: '100%',
      paddingVertical: 16, 
      borderRadius: 999,
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
