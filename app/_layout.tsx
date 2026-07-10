import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider } from '@/store';
import { CarTransitionProvider } from '@/components/car-transition';
import { PwaSetup } from '@/components/pwa-setup';
import { Toast } from '@/components/toast';
import { InstallBanner } from '@/components/install-banner';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppProvider>
        <CarTransitionProvider>
          <Stack initialRouteName="login">
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="horarios" options={{ title: 'Seleccionar horario' }} />
            <Stack.Screen name="confirmar-cita" options={{ title: 'Confirmar cita' }} />
            <Stack.Screen name="exito" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <Toast />
        </CarTransitionProvider>
      </AppProvider>
      <PwaSetup />
      <InstallBanner />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
