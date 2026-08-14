import { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';
import { SpeedometerLoader } from '@/components/speedometer-loader';

export default function EditarDatosPersonalesScreen() {
  const router = useRouter();
  const { cliente, authUser, setCliente, actualizarPerfil, showToast, tema } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);
  
  const [nombre, setNombre] = useState(authUser?.nombre || cliente?.nombre || '');
  const [telefono, setTelefono] = useState(authUser?.telefono || cliente?.telefono || '');
  const [personaRecoge, setPersonaRecoge] = useState(authUser?.pickupPerson || cliente?.personaRecoge || '');
  const [direccion, setDireccion] = useState(authUser?.direccion || cliente?.direccion || '');
  const [notas, setNotas] = useState(authUser?.notas || cliente?.notas || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authUser || cliente) {
      setNombre(authUser?.nombre || cliente?.nombre || '');
      setTelefono(authUser?.telefono || cliente?.telefono || '');
      setPersonaRecoge(authUser?.pickupPerson || cliente?.personaRecoge || '');
      setDireccion(authUser?.direccion || cliente?.direccion || '');
      setNotas(authUser?.notas || cliente?.notas || '');
    }
  }, [authUser, cliente]);

  const guardar = async () => {
    if (!nombre.trim() || !telefono.trim()) {
      showToast('Nombre y teléfono son obligatorios');
      return;
    }

    setLoading(true);
    try {
      await actualizarPerfil({
        name: nombre.trim(),
        phone: telefono.trim(),
        pickupPerson: personaRecoge.trim(),
        address: direccion.trim(),
        notes: notas.trim(),
      });

      setCliente({ 
        ...(cliente as any),
        nombre: nombre.trim(), 
        telefono: telefono.trim(), 
        personaRecoge: personaRecoge.trim(), 
        direccion: direccion.trim(), 
        notas: notas.trim() 
      });
      
      showToast('Datos personales actualizados');
      router.back();
    } catch {
      showToast('Error al actualizar datos en el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PERFIL</Text>
            <Text style={styles.title}>Datos personales</Text>
          </View>
        </View>

        <Text style={styles.label}>NOMBRE COMPLETO</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor={theme.textMuted}
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>NÚMERO DE CONTACTO</Text>
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          placeholderTextColor={theme.textMuted}
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
        />

        <Text style={styles.label}>PERSONA QUE RECOGE EL VEHÍCULO</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre (opcional)"
          placeholderTextColor={theme.textMuted}
          value={personaRecoge}
          onChangeText={setPersonaRecoge}
        />

        <Text style={styles.label}>DIRECCIÓN</Text>
        <TextInput
          style={styles.input}
          placeholder="Dirección (opcional)"
          placeholderTextColor={theme.textMuted}
          value={direccion}
          onChangeText={setDireccion}
        />

        <Text style={styles.label}>NOTAS</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notas o preferencias (opcional)"
          placeholderTextColor={theme.textMuted}
          value={notas}
          onChangeText={setNotas}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={guardar} disabled={loading}>
          {loading ? (
            <SpeedometerLoader compact size={28} accentColor="#ffffff" trackColor="rgba(255,255,255,0.28)" />
          ) : (
            <Text style={styles.buttonText}>Guardar datos</Text>
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
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingHorizontal: 18, paddingTop: 28, paddingBottom: 40, flexGrow: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 32,
    },
    backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary },
    backText: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
    headerCopy: { flex: 1 },
    eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.4, color: theme.textMuted },
    title: {
      fontSize: 32,
      lineHeight: 36,
      fontWeight: '900',
      letterSpacing: -0.9,
      color: theme.text,
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
      paddingHorizontal: 16,
      borderRadius: 16,
      fontSize: 15,
      marginBottom: 24,
      color: theme.text,
      borderWidth: 1,
      borderColor: isDark ? theme.borderStrong : theme.border,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    button: { 
      backgroundColor: theme.primary, 
      width: '100%',
      paddingVertical: 16, 
      borderRadius: 999,
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 30,
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '900' },
  });
};
