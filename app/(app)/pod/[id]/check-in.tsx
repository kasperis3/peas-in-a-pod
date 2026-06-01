import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import type { Pod } from '@/src/domain/types';
import { getRepositories } from '@/src/data/repositories';
import { useAuthStore } from '@/src/stores/auth-store';
import { Button } from '@/src/ui/components/Button';
import { Input } from '@/src/ui/components/Input';
import { Screen } from '@/src/ui/components/Screen';
import { PeaAvatar } from '@/src/ui/components/PeaAvatar';

export default function CheckInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId)!;
  const [pod, setPod] = useState<Pod | null>(null);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getRepositories()
        .pods.getPod(id)
        .then((p) => {
          setPod(p);
          if (p?.goalType === 'completion') setValue('1');
          else if (p) setValue(String(p.targetValue));
        });
    }, [id])
  );

  async function submit(checkValue: number) {
    setLoading(true);
    setError(null);
    try {
      await getRepositories().checkIns.submit(
        { podId: id, value: checkValue, note: note.trim() || undefined },
        userId
      );
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  }

  if (!pod) {
    return (
      <Screen>
        <Text className="text-podGreen">Loading…</Text>
      </Screen>
    );
  }

  const isCompletion = pod.goalType === 'completion';

  return (
    <Screen title="Quick Check-In" subtitle={`${pod.goalName} — under 10 seconds`}>
      <View className="mb-6 items-center">
        <PeaAvatar status="checked_in" size={72} />
      </View>

      {isCompletion ? (
        <Button
          label={loading ? 'Saving…' : 'Done! ✓'}
          onPress={() => submit(1)}
          disabled={loading}
        />
      ) : (
        <>
          <Input
            label={`${pod.goalName} (${pod.unit})`}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
          />
          <View className="mb-4 flex-row flex-wrap gap-2">
            {[pod.targetValue, Math.round(pod.targetValue * 0.75), Math.round(pod.targetValue * 0.5)].map(
              (preset) => (
                <Pressable
                  key={preset}
                  onPress={() => setValue(String(preset))}
                  className="rounded-full bg-peaBright/40 px-4 py-2"
                >
                  <Text className="font-medium text-podDark">{preset}</Text>
                </Pressable>
              )
            )}
          </View>
          <Button
            label={loading ? 'Saving…' : 'Save Check-In'}
            onPress={() => submit(parseFloat(value) || 0)}
            disabled={loading}
          />
        </>
      )}

      <View className="mt-4">
        <Input
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Felt strong today"
        />
      </View>

      {error && <Text className="mt-2 text-sm text-amber-700">{error}</Text>}
    </Screen>
  );
}
