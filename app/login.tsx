import { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Switch, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { SpeedometerLoader } from '@/components/speedometer-loader';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle, showToast, tema } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mantenerSesion, setMantenerSesion] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isGoogleConfigured = useMemo(() => {
    const configured = Boolean(Config.GOOGLE_CLIENT_ID && !Config.GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID'));
    return configured;
  }, []);

  useEffect(() => {
    if (isGoogleConfigured) {
      GoogleSignin.configure({
        webClientId: Config.GOOGLE_CLIENT_ID,
      });
    }
  }, [isGoogleConfigured]);

  const iniciarSesion = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Por favor llena todos los campos');
      return;
    }
    
    const userEmail = email.trim().toLowerCase();

    setLoading(true);
    try {
      const user = await loginWithEmail(userEmail, password, mantenerSesion);
      showToast(`Bienvenido ${user.nombre || ''}`);
      if (user.rol === 'lavador' || user.rol === 'admin') {
        router.replace('/lavador');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const errorText = err?.message || (typeof err === 'string' ? err : 'Error al iniciar sesión');
      showToast(errorText);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isGoogleConfigured) {
      Alert.alert(
        'Configuración de Google',
        'Para activar Google Sign-In, coloca tu GOOGLE_CLIENT_ID en "constants/Config.ts" y asegúrate de crear el ID de Android en Google Cloud Console.'
      );
      return;
    }

    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (idToken) {
        const user = await loginWithGoogle(idToken);
        showToast(`Bienvenido ${user.nombre || ''}`);
        router.replace('/(tabs)');
      } else {
        throw new Error('No se pudo obtener el token de Google');
      }
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        showToast('Inicio de sesión cancelado');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        showToast('Inicio de sesión en progreso');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showToast('Google Play Services no disponible');
      } else {
        showToast(err?.message || 'Error al iniciar sesión con Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.eyebrow}>MONKEY AUTO SPA</Text>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Agenda, consulta y recoge tu auto desde un solo lugar.</Text>

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

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Mantener Sesión Iniciada</Text>
          <Switch
            trackColor={{ false: '#d1d1d1', true: theme.primary }}
            thumbColor={Platform.OS === 'ios' ? '#fff' : '#fff'}
            ios_backgroundColor="#d1d1d1"
            onValueChange={setMantenerSesion}
            value={mantenerSesion}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, (!email.trim() || !password.trim() || loading) && styles.buttonDisabled]}
          onPress={iniciarSesion}
          disabled={!email.trim() || !password.trim() || loading}
        >
          {loading ? (
            <SpeedometerLoader compact size={28} accentColor="#ffffff" trackColor="rgba(255,255,255,0.28)" />
          ) : (
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        {/* Botón de Google */}
        <TouchableOpacity
          style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <SpeedometerLoader compact size={28} accentColor={theme.primary} trackColor={theme.border} />
          ) : (
            <View style={styles.googleContent}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleButtonText, { color: theme.text }]}>Continuar con Google</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.footerText}>¿No tienes cuenta? <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Crea una aquí</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  const isDark = tema === 'oscuro';
  return StyleSheet.create({
    container: { 
      flex: 1, 
      justifyContent: 'center', 
      backgroundColor: theme.background 
    },
    content: { 
      paddingHorizontal: 24,
      alignItems: 'center' 
    },
    logoContainer: {
      width: 126,
      height: 126,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    logo: {
      width: 126,
      height: 126,
    },
    eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.8, color: theme.primary },
    title: { fontSize: 40, lineHeight: 44, fontWeight: '900', letterSpacing: -1.3, color: theme.text, marginTop: 2 },
    subtitle: { maxWidth: 310, fontSize: 13, lineHeight: 19, color: theme.textMuted, textAlign: 'center', marginTop: 7, marginBottom: 24 },
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
      borderRadius: 16,
      fontSize: 14,
      marginBottom: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: isDark ? theme.borderStrong : theme.border,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      width: '100%',
    },
    switchLabel: {
      fontSize: 13,
      color: theme.textMuted,
      marginRight: 10,
    },
    button: { 
      backgroundColor: theme.primary, 
      width: '100%',
      paddingVertical: 16, 
      borderRadius: 999,
      alignItems: 'center',
      marginBottom: 12,
    },
    googleButton: {
      backgroundColor: theme.card,
      borderColor: theme.borderStrong,
      borderWidth: 1,
      width: '100%',
      paddingVertical: 14,
      borderRadius: 999,
      alignItems: 'center',
      marginBottom: 24,
    },
    googleContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    googleIcon: {
      fontWeight: 'bold',
      fontSize: 16,
      marginRight: 10,
      color: '#4285F4',
    },
    googleButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    buttonDisabled: { 
      opacity: 0.5 
    },
    buttonText: { 
      color: 'white', 
      fontSize: 16, 
      fontWeight: 'bold' 
    },
    footerText: {
      fontSize: 13,
      color: theme.textMuted,
    },
  });
};
