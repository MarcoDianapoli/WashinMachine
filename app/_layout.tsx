import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { AppProvider, useApp } from '@/store';
import { CarTransitionProvider } from '@/components/car-transition';
import { Toast } from '@/components/toast';

export const unstable_settings = {
  initialRouteName: 'login',
};

function RootNavigation() {
  const { tema, isAuthChecking, authUser } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(Colors[tema].background);
  }, [tema]);

  useEffect(() => {
    if (isAuthChecking) return;

    const currentRoute = segments[0];
    const isUnauthRoute = currentRoute === 'login' || currentRoute === 'register' || !currentRoute;

    if (authUser && isUnauthRoute) {
      if (authUser.rol === 'lavador') {
        router.replace('/lavador');
      } else {
        router.replace('/(tabs)');
      }
    } else if (!authUser && !isUnauthRoute) {
      router.replace('/login');
    }
  }, [isAuthChecking, authUser, segments]);

  if (isAuthChecking) {
    const theme = Colors[tema];
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={tema === 'oscuro' ? DarkTheme : DefaultTheme}>
      <CarTransitionProvider>
        <Stack initialRouteName="login">
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="editar-datos-personales" options={{ headerShown: false }} />
          <Stack.Screen name="editar-vehiculo" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="lavador" options={{ headerShown: false }} />
          <Stack.Screen name="horarios" options={{ title: 'Seleccionar horario' }} />
          <Stack.Screen name="confirmar-cita" options={{ title: 'Confirmar cita' }} />
          <Stack.Screen name="exito" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <Toast />
      </CarTransitionProvider>
      <StatusBar style={tema === 'oscuro' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigation />
    </AppProvider>
  );
}
