import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApp } from '@/store';

export default function LavadorLayout() {
  const { tema } = useApp();
  const theme = Colors[tema];

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.background },
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '800' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="scanner" options={{ presentation: 'modal', title: 'Escanear QR' }} />
    </Stack>
  );
}
