import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/store';

export default function PerfilMenuScreen() {
  const router = useRouter();
  const { cliente, setCliente } = useApp();

  const handleLogout = () => {
    // Por el momento simplemente quitamos el cliente y vamos al login
    // setCliente(null); // Descomentar cuando quieras que se borre real la sesión
    router.replace('/login');
  };

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
            <Ionicons name="qr-code-outline" size={24} color="#dc2626" />
          </View>
        </View>

        {/* Lista de Opciones */}
        <View style={styles.menuSection}>
          
          <MenuItem 
            icon="person-outline" 
            title="Datos Personales" 
            subtitle="Nombre, número de contacto, dirección"
            onPress={() => router.push('/editar-datos-personales')}
          />

          <MenuItem 
            icon="car-outline" 
            title="Mi Vehículo" 
            subtitle="Marca, modelo, placas, fotos"
            onPress={() => router.push('/editar-vehiculo')}
          />

          <MenuItem 
            icon="calendar-outline" 
            title="Historial de Citas" 
            subtitle="Revisar lavados pasados y recibos"
            onPress={() => {}}
          />

          <MenuItem 
            icon="star-outline" 
            title="Suscripciones" 
            subtitle="Explorar beneficios premium y paquetes"
            onPress={() => {}}
          />

          <MenuItem 
            icon="notifications-outline" 
            title="Notificaciones" 
            subtitle="Recordatorios de lavado y promociones"
            onPress={() => {}}
          />

          <MenuItem 
            icon="color-palette-outline" 
            title="Apariencia" 
            subtitle="Tema oscuro activado por defecto"
            onPress={() => {}}
          />

          <MenuItem 
            icon="log-out-outline" 
            title="Cerrar Sesión" 
            subtitle="Salir de tu cuenta actual"
            onPress={handleLogout}
            isDestructive
          />

        </View>
      </ScrollView>
    </View>
  );
}

// Componente reutilizable para las opciones del menú
function MenuItem({ icon, title, subtitle, onPress, isDestructive = false }: any) {
  const color = isDestructive ? '#dc2626' : '#999';
  const titleColor = isDestructive ? '#dc2626' : '#fff';
  
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: titleColor }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Negro puro para fondo
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
    borderBottomColor: '#1c1c1e', // Gris muy oscuro
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1c1c1e',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff', // Texto blanco
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    color: '#888', // Gris medio
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
    borderBottomColor: '#1c1c1e', // Divider color
    paddingBottom: 16,
  },
  menuTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#888',
  },
});
