import { Stack } from 'expo-router';

export default function LavadorLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="scanner" options={{ presentation: 'modal', title: 'Escanear QR' }} />
    </Stack>
  );
}
