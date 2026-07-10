import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/Colors';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider, useApp } from '@/store';
import { CarTransitionProvider } from '@/components/car-transition';
import { PwaSetup } from '@/components/pwa-setup';
import { Toast } from '@/components/toast';
import { InstallBanner } from '@/components/install-banner';

export const unstable_settings = {
  initialRouteName: 'login',
};

function RootNavigation() {
  const { tema } = useApp();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(Colors[tema].background);
  }, [tema]);

  return (
    <ThemeProvider value={tema === 'oscuro' ? DarkTheme : DefaultTheme}>
      <CarTransitionProvider>
        <Stack initialRouteName="login">
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="editar-datos-personales" options={{ headerShown: false }} />
          <Stack.Screen name="editar-vehiculo" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="horarios" options={{ title: 'Seleccionar horario' }} />
          <Stack.Screen name="confirmar-cita" options={{ title: 'Confirmar cita' }} />
          <Stack.Screen name="exito" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <Toast />
      </CarTransitionProvider>
      <PwaSetup />
      <InstallBanner />
      <StatusBar style={tema === 'oscuro' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigation />
    </AppProvider>
  );
}
