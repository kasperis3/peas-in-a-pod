import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/auth-store';
import { WelcomeContent } from '@/src/ui/screens/WelcomeContent';

export default function Index() {
  const userId = useAuthStore((s) => s.userId);
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) {
    return <WelcomeContent />;
  }

  if (userId) return <Redirect href="/(app)" />;
  return <Redirect href="/welcome" />;
}
