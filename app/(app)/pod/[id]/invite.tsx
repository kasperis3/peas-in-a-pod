import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getRepositories } from '@/src/data/repositories';
import { useAuthStore } from '@/src/stores/auth-store';
import { Button } from '@/src/ui/components/Button';
import { Screen } from '@/src/ui/components/Screen';

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId)!;
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const repos = getRepositories();
    const existing = await repos.invites.getActiveCode(id);
    if (existing) setCode(existing.code);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function generate() {
    setLoading(true);
    try {
      const invite = await getRepositories().invites.generateCode(id, userId);
      setCode(invite.code);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Screen title="Invite Peas" subtitle="Share this code — friends request to join, you approve">
      {code ? (
        <View className="mb-6 items-center rounded-2xl bg-white py-8 border border-podGreen/20">
          <Text className="text-3xl font-bold tracking-widest text-podDark">{code}</Text>
          <Text className="mt-2 text-sm text-podGreen">Expires in 7 days</Text>
        </View>
      ) : (
        <Text className="mb-4 text-podGreen">No active code yet. Generate one for your pod.</Text>
      )}
      <Button label={loading ? 'Generating…' : code ? 'Regenerate Code' : 'Generate Code'} onPress={generate} disabled={loading} />
      {code && (
        <View className="mt-3">
          <Button label={copied ? 'Copied!' : 'Copy Code'} onPress={copy} variant="secondary" />
        </View>
      )}
    </Screen>
  );
}
