import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/src/stores/auth-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    initialize().finally(() => SplashScreen.hideAsync());
  }, [initialize]);

  if (!initialized) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F5F0' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
