import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/src/stores/auth-store';

export default function Index() {
  const userId = useAuthStore((s) => s.userId);
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator color="#2D6A4F" />
      </View>
    );
  }

  if (userId) return <Redirect href="/(app)" />;
  return <Redirect href="/(auth)/welcome" />;
}
