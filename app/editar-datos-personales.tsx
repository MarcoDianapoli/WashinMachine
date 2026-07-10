import { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';

export default function EditarDatosPersonalesScreen() {
  const router = useRouter();
  const { cliente, setCliente, showToast, tema } = useApp();
  const theme = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);
  
  const [nombre, setNombre] = useState(cliente?.nombre ?? '');
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '');
  const [personaRecoge, setPersonaRecoge] = useState(cliente?.personaRecoge ?? '');
  const [direccion, setDireccion] = useState(cliente?.direccion ?? '');
  const [notas, setNotas] = useState(cliente?.notas ?? '');

  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre);
      setTelefono(cliente.telefono);
      setPersonaRecoge(cliente.personaRecoge ?? '');
      setDireccion(cliente.direccion ?? '');
      setNotas(cliente.notas ?? '');
    }
  }, [cliente]);

  const guardar = () => {
    if (!nombre.trim() || !telefono.trim()) {
      showToast('Nombre y teléfono son obligatorios');
      return;
    }
    
    setCliente({ 
      ...cliente, 
      nombre, 
      telefono, 
      vehiculo: cliente?.vehiculo || { placa: '', marca: '', modelo: '', color: '' }, 
      personaRecoge, 
      direccion, 
      notas 
    });
    
    showToast('Datos personales actualizados');
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Datos Personales</Text>
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

        <TouchableOpacity style={styles.button} onPress={guardar}>
          <Text style={styles.buttonText}>Guardar datos</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingHorizontal: 20, paddingVertical: 40, flexGrow: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 40,
      marginTop: 20,
    },
    backBtn: { padding: 10, position: 'absolute', zIndex: 1, left: -10 },
    backText: { color: theme.primary, fontSize: 16, fontWeight: '600' },
    title: {
      flex: 1,
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
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
      borderRadius: 8,
      fontSize: 15,
      marginBottom: 24,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    button: { 
      backgroundColor: theme.primary, 
      width: '100%',
      paddingVertical: 16, 
      borderRadius: 8, 
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 30,
    },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  });
};
