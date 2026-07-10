import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/store';
import { Colors } from '@/constants/Colors';

export default function PerfilMenuScreen() {
  const router = useRouter();
  const { cliente, setCliente, tema, toggleTema } = useApp();

  const handleLogout = () => {
    // Por el momento simplemente quitamos el cliente y vamos al login
    // setCliente(null); // Descomentar cuando quieras que se borre real la sesión
    router.replace('/login');
  };

  const styles = useMemo(() => getStyles(tema), [tema]);
  const isDark = tema === 'oscuro';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Cabecera del Perfil (Estilo WhatsApp) */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=' + (cliente?.nombre || 'Usuario') + '&background=dc2626&color=fff&size=128' }} 
              style={styles.avatar}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{cliente?.nombre || 'Usuario Invitado'}</Text>
            <Text style={styles.profileUsername}>
              {cliente?.telefono ? `Tel: ${cliente.telefono}` : '@usuario'}
            </Text>
          </View>
          <View style={styles.qrContainer}>
            <Ionicons name="qr-code-outline" size={24} color={Colors[tema].primary} />
          </View>
        </View>

        {/* Lista de Opciones */}
        <View style={styles.menuSection}>
          
          <MenuItem 
            icon="person-outline" 
            title="Datos Personales" 
            subtitle="Nombre, número de contacto, dirección"
            onPress={() => router.push('/editar-datos-personales')}
            tema={tema}
          />

          <MenuItem 
            icon="car-outline" 
            title="Mi Vehículo" 
            subtitle="Marca, modelo, placas, fotos"
            onPress={() => router.push('/editar-vehiculo')}
            tema={tema}
          />

          <MenuItem 
            icon="calendar-outline" 
            title="Historial de Citas" 
            subtitle="Revisar lavados pasados y recibos"
            onPress={() => {}}
            tema={tema}
          />

          <MenuItem 
            icon="star-outline" 
            title="Suscripciones" 
            subtitle="Explorar beneficios premium y paquetes"
            onPress={() => {}}
            tema={tema}
          />

          <MenuItem 
            icon="notifications-outline" 
            title="Notificaciones" 
            subtitle="Recordatorios de lavado y promociones"
            onPress={() => {}}
            tema={tema}
          />

          <MenuItem 
            icon={isDark ? "moon-outline" : "sunny-outline"} 
            title="Modo Oscuro" 
            subtitle="Cambiar apariencia de la app"
            onPress={() => {}} // Disabled click since we have switch
            tema={tema}
            rightElement={
              <Switch 
                value={isDark} 
                onValueChange={toggleTema}
                trackColor={{ false: '#767577', true: Colors[tema].primary }}
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
    </View>
  );
}

// Componente reutilizable para las opciones del menú
function MenuItem({ icon, title, subtitle, onPress, isDestructive = false, tema, rightElement }: any) {
  const styles = useMemo(() => getStyles(tema), [tema]);
  const themeColors = Colors[tema];
  const color = isDestructive ? themeColors.danger : themeColors.textMuted;
  const titleColor = isDestructive ? themeColors.danger : themeColors.text;
  
  return (
    <TouchableOpacity style={styles.menuItem} onPress={rightElement ? undefined : onPress} disabled={!!rightElement}>
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
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.card,
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
    qrContainer: {
      padding: 8,
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
    }
  });
};
