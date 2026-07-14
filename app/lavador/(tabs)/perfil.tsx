import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';
import * as ImagePicker from 'expo-image-picker';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function LavadorPerfil() {
  const router = useRouter();
  const { authUser, actualizarPerfilLavador, logout, tema, toggleTema, showToast } = useApp();
  const themeColors = Colors[tema];
  const styles = useMemo(() => getStyles(tema), [tema]);
  const isDark = tema === 'oscuro';

  const [editando, setEditando] = useState(false);
  const [telefono, setTelefono] = useState(authUser?.telefono || '');
  
  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      actualizarPerfilLavador({ fotoPerfil: result.assets[0].uri });
      showToast('Foto actualizada');
    }
  };

  const guardarTelefono = () => {
    actualizarPerfilLavador({ telefono });
    setEditando(false);
    showToast('Teléfono actualizado');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Cabecera del Perfil */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} activeOpacity={0.8}>
            {authUser?.fotoPerfil ? (
              <Image source={{ uri: authUser.fotoPerfil }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="camera-outline" size={32} color={themeColors.background} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="white" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{authUser?.nombre || 'Lavador'}</Text>
            <Text style={styles.profileUsername}>{authUser?.email}</Text>
          </View>
        </View>

        {/* Lista de Opciones */}
        <View style={styles.menuSection}>
          
          <MenuItem 
            icon="call-outline" 
            title="Número de Teléfono" 
            subtitle={telefono || "Agregar número"}
            onPress={() => setEditando(!editando)}
            tema={tema}
          />
          
          {editando && (
            <View style={styles.editPhoneContainer}>
              <TextInput
                style={styles.input}
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
                placeholder="Ej. 555-1234"
                placeholderTextColor={themeColors.textMuted}
                autoFocus
              />
              <TouchableOpacity style={styles.saveButton} onPress={guardarTelefono}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          )}

          <MenuItem 
            icon={isDark ? "moon-outline" : "sunny-outline"} 
            title="Modo Oscuro" 
            subtitle="Cambiar apariencia de la app"
            onPress={() => {}} 
            tema={tema}
            rightElement={
              <Switch 
                value={isDark} 
                onValueChange={toggleTema}
                trackColor={{ false: '#767577', true: themeColors.primary }}
                thumbColor={'#fff'}
              />
            }
          />

          <MenuItem 
            icon="log-out-outline" 
            title="Cerrar Sesión" 
            subtitle="Salir de tu cuenta actual"
            onPress={handleLogout}
            isDestructive
            tema={tema}
          />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente reutilizable
function MenuItem({ icon, title, subtitle, onPress, isDestructive = false, tema, rightElement }: any) {
  const styles = useMemo(() => getStyles(tema), [tema]);
  const themeColors = Colors[tema];
  const color = isDestructive ? themeColors.danger || '#ef4444' : themeColors.textMuted;
  const titleColor = isDestructive ? themeColors.danger || '#ef4444' : themeColors.text;
  
  return (
    <TouchableOpacity style={styles.menuItem} onPress={rightElement ? undefined : onPress} disabled={!!rightElement && !onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.menuTextContainer}>
        <View style={styles.menuTextRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuTitle, { color: titleColor }]}>{title}</Text>
            {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
          </View>
          {rightElement && <View>{rightElement}</View>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (tema: 'claro' | 'oscuro') => {
  const theme = Colors[tema];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingVertical: 20,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 30,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: 10,
    },
    avatarContainer: {
      marginRight: 16,
      position: 'relative',
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.card,
    },
    avatarPlaceholder: {
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: -5,
      backgroundColor: theme.primary,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.background,
    },
    profileInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    profileName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    profileUsername: {
      fontSize: 14,
      color: theme.textMuted,
    },
    menuSection: {
      paddingTop: 10,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    menuIcon: {
      width: 32,
      alignItems: 'center',
      marginRight: 16,
    },
    menuTextContainer: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 16,
    },
    menuTitle: {
      fontSize: 16,
      marginBottom: 2,
    },
    menuSubtitle: {
      fontSize: 13,
      color: theme.textMuted,
    },
    menuTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    editPhoneContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginLeft: 68,
      alignItems: 'center',
    },
    input: {
      flex: 1,
      backgroundColor: theme.card,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 10,
    },
    saveButton: {
      backgroundColor: theme.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    saveButtonText: {
      color: 'white',
      fontWeight: 'bold',
    }
  });
};
