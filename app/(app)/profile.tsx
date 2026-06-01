import { Text } from 'react-native';
import { router } from 'expo-router';
import { usesLocalData } from '@/src/data/repositories';
import { useAuthStore } from '@/src/stores/auth-store';
import { Button } from '@/src/ui/components/Button';
import { Screen } from '@/src/ui/components/Screen';

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/welcome');
  }

  return (
    <Screen title="Profile">
      <Text className="mb-1 text-lg font-semibold text-podDark">{profile?.name}</Text>
      <Text className="mb-6 text-podGreen">{profile?.email}</Text>
      {usesLocalData() && (
        <Text className="mb-4 text-sm text-peaDroopy">
          Running in local demo mode. Add Supabase keys in .env to sync across devices.
        </Text>
      )}
      <Button label="Sign Out" onPress={handleSignOut} variant="ghost" />
    </Screen>
  );
}
