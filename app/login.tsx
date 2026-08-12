import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Switch, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { ApiError } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle, loginLavador, showToast, tema } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mantenerSesion, setMantenerSesion] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isGoogleConfigured = useMemo(() => {
    return Boolean(Config.GOOGLE_CLIENT_ID && !Config.GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID'));
  }, []);

  const redirectUri = useMemo(() => {
    return AuthSession.makeRedirectUri({
      scheme: 'autolavado',
    });
  }, []);

  const iniciarSesion = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Por favor llena todos los campos');
      return;
    }
    
    const userEmail = email.trim().toLowerCase();
    
    if ((userEmail === 'admin@monkey.com' || userEmail === 'admin@test.com' || userEmail.startsWith('lavador')) && loginLavador(password)) {
      showToast('Bienvenido al área de lavadores');
      router.replace('/lavador');
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithEmail(userEmail, password, mantenerSesion);
      showToast(`Bienvenido ${user.nombre || ''}`);
      if (user.rol === 'lavador') {
        router.replace('/lavador');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message || 'Credenciales incorrectas');
      } else {
        showToast('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const clientId = Config.GOOGLE_CLIENT_ID;

    if (!isGoogleConfigured) {
      Alert.alert(
        'Configuración de Google',
        'Para activar Google Sign-In, coloca tu GOOGLE_CLIENT_ID en "constants/Config.ts".'
      );
      return;
    }

    setGoogleLoading(true);
    try {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `response_type=id_token` +
        `&client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&nonce=${Math.random().toString(36).substring(2)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const match = result.url.match(/id_token=([^&]+)/);
        const idToken = match ? match[1] : null;

        if (idToken) {
          const user = await loginWithGoogle(idToken);
          showToast(`Bienvenido ${user.nombre}`);
          router.replace('/(tabs)');
          return;
        }
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        showToast('Inicio de sesión cancelado');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al iniciar sesión con Google');
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
            <ActivityIndicator color="#fff" />
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
            <ActivityIndicator color={theme.text} />
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
  return StyleSheet.create({
    container: { 
      flex: 1, 
      justifyContent: 'center', 
      backgroundColor: theme.background 
    },
    content: { 
      paddingHorizontal: 30, 
      alignItems: 'center' 
    },
    logoContainer: {
      width: 170,
      height: 170,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    logo: {
      width: 170,
      height: 170,
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
      marginBottom: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
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
      borderRadius: 6, 
      alignItems: 'center',
      marginBottom: 12,
    },
    googleButton: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderWidth: 1,
      width: '100%',
      paddingVertical: 14,
      borderRadius: 6,
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
