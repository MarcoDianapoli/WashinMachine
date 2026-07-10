import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Switch, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const { setCliente, showToast, tema } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mantenerSesion, setMantenerSesion] = useState(true);

  const iniciarSesion = () => {
    if (!email.trim() || !password.trim()) {
      showToast('Por favor llena todos los campos');
      return;
    }
    
    // Simulación de API / Validación local
    if (email.trim().toLowerCase() === 'admin@test.com' && password === '123456') {
      // Éxito: Guardamos el estado y navegamos
      setCliente({ 
        nombre: 'Admin Usuario', 
        telefono: '0000000000', 
        vehiculo: { placa: '', marca: '', modelo: '', color: '' }, 
        personaRecoge: '', 
        direccion: '', 
        notas: '' 
      });
      showToast('Bienvenido');
      router.replace('/(tabs)');
    } else {
      // Error
      showToast('Credenciales incorrectas');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        
        <View style={styles.logoContainer}>
          {/* 
            IMPORTANTE: 
            Asegúrate de guardar el logo que pasaste en la carpeta:
            assets/images/logo.png
          */}
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
          <Text style={styles.switchLabel}>Mantener Sesion Iniciada</Text>
          <Switch
            trackColor={{ false: '#d1d1d1', true: theme.primary }}
            thumbColor={Platform.OS === 'ios' ? '#fff' : '#fff'}
            ios_backgroundColor="#d1d1d1"
            onValueChange={setMantenerSesion}
            value={mantenerSesion}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, (!email.trim() || !password.trim()) && styles.buttonDisabled]}
          onPress={iniciarSesion}
          disabled={!email.trim() || !password.trim()}
        >
          <Text style={styles.buttonText}>Iniciar Sesion</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.footerText}>Crea una cuenta aqui</Text>
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
      marginBottom: 20,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 30,
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
      marginBottom: 30,
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
