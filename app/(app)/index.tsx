import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/src/stores/auth-store';
import { usePodsStore } from '@/src/stores/pods-store';
import { PodCard } from '@/src/ui/components/PodCard';
import { Screen } from '@/src/ui/components/Screen';
import { Button } from '@/src/ui/components/Button';

export default function HomeScreen() {
  const userId = useAuthStore((s) => s.userId)!;
  const profile = useAuthStore((s) => s.profile);
  const pods = usePodsStore((s) => s.pods);
  const rosterByPod = usePodsStore((s) => s.rosterByPod);
  const pendingCount = usePodsStore((s) => s.pendingCount);
  const fetchPods = usePodsStore((s) => s.fetchPods);
  const fetchRoster = usePodsStore((s) => s.fetchRoster);
  const fetchPendingCount = usePodsStore((s) => s.fetchPendingCount);

  const load = useCallback(async () => {
    await fetchPods(userId);
    const list = usePodsStore.getState().pods;
    await Promise.all(list.map((p) => fetchRoster(p.id)));
    const leaderPods = list.filter((p) => p.leaderId === userId);
    if (leaderPods.length) await fetchPendingCount(userId);
  }, [userId, fetchPods, fetchRoster, fetchPendingCount]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const duePods = pods.filter((pod) => {
    const roster = rosterByPod[pod.id];
    const me = roster?.find((m) => m.membership.userId === userId);
    if (!me) return true;
    return me.status !== 'checked_in';
  });

  return (
    <Screen
      title={`Hey, ${profile?.name?.split(' ')[0] ?? 'Pea'}`}
      subtitle="What do you need to do right now?"
      action={
        <Link href="/(app)/profile" asChild>
          <Pressable>
            <Text className="text-sm font-semibold text-podGreen">Profile</Text>
          </Pressable>
        </Link>
      }
    >
      {pendingCount > 0 && (
        <Pressable
          onPress={() => router.push('/(app)/requests')}
          className="mb-4 rounded-2xl bg-podGreen/10 p-4"
        >
          <Text className="font-semibold text-podDark">
            {pendingCount} pending membership request{pendingCount > 1 ? 's' : ''}
          </Text>
          <Text className="mt-1 text-sm text-podGreen">Tap to review</Text>
        </Pressable>
      )}

      <Text className="mb-2 text-lg font-bold text-podDark">Today&apos;s Check-Ins</Text>
      {duePods.length === 0 ? (
        <Text className="mb-6 text-sm text-podGreen">You&apos;re all caught up — keep growing!</Text>
      ) : (
        duePods.map((pod) => {
          const me = rosterByPod[pod.id]?.find((m) => m.membership.userId === userId);
          return (
            <PodCard
              key={pod.id}
              pod={pod}
              streak={me?.currentStreak}
              status={me?.status ?? 'due_soon'}
              onPress={() => router.push(`/(app)/pod/${pod.id}/check-in`)}
            />
          );
        })
      )}

      <View className="mb-2 mt-4 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-podDark">My Pods</Text>
        <View className="flex-row gap-2">
          <Link href="/(app)/join-pod" asChild>
            <Pressable>
              <Text className="text-sm font-semibold text-podGreen">Join</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {pods.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-center text-podGreen">Start a pod and invite your peas.</Text>
          <View className="mt-4 w-full">
            <Button label="Create Your First Pod" onPress={() => router.push('/(app)/create-pod')} />
          </View>
        </View>
      ) : (
        pods.map((pod) => {
          const me = rosterByPod[pod.id]?.find((m) => m.membership.userId === userId);
          return (
            <PodCard
              key={pod.id}
              pod={pod}
              streak={me?.currentStreak}
              status={me?.status ?? 'due_soon'}
              onPress={() => router.push(`/(app)/pod/${pod.id}`)}
            />
          );
        })
      )}

      <View className="mt-6">
        <Button label="Create Pod" onPress={() => router.push('/(app)/create-pod')} variant="secondary" />
      </View>
    </Screen>
  );
}
