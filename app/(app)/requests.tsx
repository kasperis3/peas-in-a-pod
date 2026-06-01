import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getRepositories } from '@/src/data/repositories';
import { useAuthStore } from '@/src/stores/auth-store';
import { usePodsStore } from '@/src/stores/pods-store';
import { Button } from '@/src/ui/components/Button';
import { Screen } from '@/src/ui/components/Screen';

export default function RequestsScreen() {
  const userId = useAuthStore((s) => s.userId)!;
  const fetchPendingCount = usePodsStore((s) => s.fetchPendingCount);
  const [pending, setPending] = useState<
    Awaited<ReturnType<ReturnType<typeof getRepositories>['memberships']['listPendingForLeader']>>
  >([]);

  const load = useCallback(async () => {
    const repos = getRepositories();
    const list = await repos.memberships.listPendingForLeader(userId);
    setPending(list);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function approve(id: string) {
    const repos = getRepositories();
    await repos.memberships.approve(id);
    await load();
    await fetchPendingCount(userId);
  }

  async function reject(id: string) {
    const repos = getRepositories();
    await repos.memberships.reject(id);
    await load();
    await fetchPendingCount(userId);
  }

  return (
    <Screen title="Pending Requests" subtitle="Welcome new peas to your pod">
      {pending.length === 0 ? (
        <Text className="text-podGreen">No pending requests right now.</Text>
      ) : (
        pending.map((item) => (
          <View key={item.id} className="mb-3 rounded-2xl bg-white p-4 border border-podGreen/15">
            <Text className="font-bold text-podDark">{item.pod.name}</Text>
            <Text className="mt-1 text-sm text-podGreen">New member request</Text>
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Button label="Approve" onPress={() => approve(item.id)} />
              </View>
              <View className="flex-1">
                <Button label="Decline" onPress={() => reject(item.id)} variant="ghost" />
              </View>
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
