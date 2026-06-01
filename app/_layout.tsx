import '../global.css';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/src/stores/auth-store';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize().finally(() => {
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync();
      }
    });
  }, [initialize]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F5F0' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
