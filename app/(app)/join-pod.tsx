import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { getRepositories } from '@/src/data/repositories';
import { useAuthStore } from '@/src/stores/auth-store';
import { Button } from '@/src/ui/components/Button';
import { Input } from '@/src/ui/components/Input';
import { Screen } from '@/src/ui/components/Screen';

export default function JoinPodScreen() {
  const userId = useAuthStore((s) => s.userId)!;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      const repos = getRepositories();
      const membership = await repos.invites.redeemCode(code, userId);
      setSuccess(true);
      setTimeout(() => router.replace(`/(app)/pod/${membership.podId}`), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join pod');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="Join a Pod" subtitle="Enter the invite code from your pod leader">
      <Input
        label="Invite code"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="PEA-4821"
        autoCapitalize="characters"
      />
      {error && <Text className="mb-3 text-sm text-amber-700">{error}</Text>}
      {success && (
        <Text className="mb-3 text-sm text-podGreen">
          Request sent! Your leader will approve you soon.
        </Text>
      )}
      <Button label={loading ? 'Joining…' : 'Request to Join'} onPress={handleJoin} disabled={loading || code.length < 6} />
    </Screen>
  );
}
