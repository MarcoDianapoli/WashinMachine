import '@/lib/notifications';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { AppProvider, useApp } from '@/store';
import { Toast } from '@/components/toast';
import { SpeedometerLoader } from '@/components/speedometer-loader';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 450, fade: true });

export const unstable_settings = {
  initialRouteName: 'login',
};

function RootNavigation() {
  const { tema, isAuthChecking, authUser } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(Colors[tema].background);
  }, [tema]);

  useEffect(() => {
    if (isAuthChecking) return;

    const currentRoute = segments[0];
    const isUnauthRoute = currentRoute === 'login' || currentRoute === 'register' || !currentRoute;
    const isWasherRoute = currentRoute === 'lavador';
    const isStaff = authUser?.rol === 'lavador' || authUser?.rol === 'admin';

    if (authUser) {
      if (isStaff && !isWasherRoute) {
        router.replace('/lavador');
      } else if (!isStaff && (isUnauthRoute || isWasherRoute)) {
        router.replace('/(tabs)');
      }
    } else if (!isUnauthRoute) {
      router.replace('/login');
    }
  }, [isAuthChecking, authUser, router, segments]);

  if (isAuthChecking) {
    return (
      <>
        <SpeedometerLoader fullScreen message="Calentando motores" />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <ThemeProvider value={tema === 'oscuro' ? DarkTheme : DefaultTheme}>
      <Stack
        initialRouteName="login"
        screenOptions={{
          contentStyle: { backgroundColor: Colors[tema].background },
          headerStyle: { backgroundColor: Colors[tema].background },
          headerTintColor: Colors[tema].text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '800' },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="editar-datos-personales" options={{ headerShown: false }} />
        <Stack.Screen name="editar-vehiculo" options={{ headerShown: false }} />
        <Stack.Screen name="mis-citas" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="lavador" options={{ headerShown: false }} />
        <Stack.Screen name="horarios" options={{ title: 'Seleccionar horario' }} />
        <Stack.Screen name="confirmar-cita" options={{ title: 'Confirmar cita' }} />
        <Stack.Screen name="exito" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <Toast />
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
