import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { CadenceType, GoalType } from '@/src/domain/types';
import { getRepositories } from '@/src/data/repositories';
import { useAuthStore } from '@/src/stores/auth-store';
import { Button } from '@/src/ui/components/Button';
import { Input } from '@/src/ui/components/Input';
import { Screen } from '@/src/ui/components/Screen';

const CADENCES: { label: string; value: CadenceType }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function CreatePodScreen() {
  const userId = useAuthStore((s) => s.userId)!;
  const [name, setName] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('measurement');
  const [targetValue, setTargetValue] = useState('100');
  const [unit, setUnit] = useState('reps');
  const [cadence, setCadence] = useState<CadenceType>('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const repos = getRepositories();
      const pod = await repos.pods.createPod(
        {
          name: name.trim(),
          goalName: goalName.trim(),
          goalType,
          targetValue: goalType === 'completion' ? 1 : parseFloat(targetValue) || 0,
          unit: goalType === 'completion' ? '' : unit.trim(),
          cadenceType: cadence,
        },
        userId
      );
      router.replace(`/(app)/pod/${pod.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create pod');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="New Pod" subtitle="Set a goal your peas can track together">
      <Input label="Pod name" value={name} onChangeText={setName} placeholder="Pushup Pod" />
      <Input label="Goal" value={goalName} onChangeText={setGoalName} placeholder="Pushups" />

      <Text className="mb-2 text-sm font-medium text-podDark">Goal type</Text>
      <View className="mb-4 flex-row gap-2">
        {(['measurement', 'completion'] as GoalType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setGoalType(t)}
            className={`flex-1 rounded-xl border py-3 ${
              goalType === t ? 'border-podGreen bg-podGreen/15' : 'border-podGreen/20 bg-white'
            }`}
          >
            <Text className="text-center font-medium text-podDark">
              {t === 'completion' ? 'Done / Not' : 'Measurable'}
            </Text>
          </Pressable>
        ))}
      </View>

      {goalType === 'measurement' && (
        <>
          <Input
            label="Target value"
            value={targetValue}
            onChangeText={setTargetValue}
            keyboardType="numeric"
          />
          <Input label="Unit" value={unit} onChangeText={setUnit} placeholder="reps, oz, hours…" />
        </>
      )}

      <Text className="mb-2 text-sm font-medium text-podDark">Cadence</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {CADENCES.map((c) => (
          <Pressable
            key={c.value}
            onPress={() => setCadence(c.value)}
            className={`rounded-full px-4 py-2 ${
              cadence === c.value ? 'bg-podGreen' : 'bg-white border border-podGreen/20'
            }`}
          >
            <Text className={cadence === c.value ? 'text-white font-semibold' : 'text-podDark'}>
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && <Text className="mb-3 text-sm text-amber-700">{error}</Text>}
      <Button label={loading ? 'Creating…' : 'Create Pod'} onPress={handleCreate} disabled={loading || !name || !goalName} />
    </Screen>
  );
}
