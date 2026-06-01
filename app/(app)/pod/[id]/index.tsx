import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getRepositories } from '@/src/data/repositories';
import { useAuthStore } from '@/src/stores/auth-store';
import { usePodsStore } from '@/src/stores/pods-store';
import type { Pod, PodMemberView } from '@/src/domain/types';
import { PeaAvatar } from '@/src/ui/components/PeaAvatar';
import { StatusChip } from '@/src/ui/components/StatusChip';
import { Screen } from '@/src/ui/components/Screen';
import { Button } from '@/src/ui/components/Button';
import {
  copyPodNotes,
  copyPodTsv,
  sharePodNotes,
  sharePodTsvFile,
} from '@/src/services/pod-export';

export default function PodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId)!;
  const [pod, setPod] = useState<Pod | null>(null);
  const [roster, setRoster] = useState<PodMemberView[]>([]);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const fetchRoster = usePodsStore((s) => s.fetchRoster);

  const load = useCallback(async () => {
    const repos = getRepositories();
    const p = await repos.pods.getPod(id);
    setPod(p);
    const m = await repos.memberships.getMembership(id, userId);
    setMembershipStatus(m?.status ?? null);
    const r = await fetchRoster(id);
    setRoster(r);
  }, [id, userId, fetchRoster]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const isLeader = pod?.leaderId === userId;
  const isActive = membershipStatus === 'active';
  const isPending = membershipStatus === 'pending';
  const [exportBusy, setExportBusy] = useState(false);

  async function runExport(action: () => Promise<void>, successMessage: string) {
    if (!pod || roster.length === 0) {
      Alert.alert('Nothing to export', 'Add active members and check-ins first.');
      return;
    }
    setExportBusy(true);
    try {
      await action();
      Alert.alert('Done', successMessage);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setExportBusy(false);
    }
  }

  function formatLastCheckIn(date: string | undefined) {
    if (!date) return 'No check-ins yet';
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (!pod) {
    return (
      <Screen>
        <Text className="text-podGreen">Loading pod…</Text>
      </Screen>
    );
  }

  return (
    <Screen
      title={pod.name}
      subtitle={`${pod.goalName} · ${pod.targetValue}${pod.unit ? ` ${pod.unit}` : ''} · ${pod.cadenceType}`}
      action={
        <Pressable onPress={() => router.back()}>
          <Text className="text-sm font-semibold text-podGreen">Back</Text>
        </Pressable>
      }
    >
      {isPending && (
        <View className="mb-4 rounded-2xl bg-dueSoon/30 p-4">
          <Text className="font-medium text-podDark">Waiting for leader approval</Text>
          <Text className="mt-1 text-sm text-podGreen">You can check in once you&apos;re approved.</Text>
        </View>
      )}

      {isLeader && (
        <View className="mb-4 flex-row gap-2">
          <View className="flex-1">
            <Button label="Invite" onPress={() => router.push(`/(app)/pod/${id}/invite`)} variant="secondary" />
          </View>
          <View className="flex-1">
            <Button label="Requests" onPress={() => router.push('/(app)/requests')} variant="ghost" />
          </View>
        </View>
      )}

      <Text className="mb-3 text-lg font-bold text-podDark">Who has checked in?</Text>
      {roster.length === 0 ? (
        <Text className="text-podGreen">No active members yet.</Text>
      ) : (
        roster.map((member) => (
          <View
            key={member.membership.id}
            className="mb-2 flex-row items-center rounded-2xl bg-white p-3 border border-podGreen/10"
          >
            <PeaAvatar status={member.status} size={44} />
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-podDark">{member.profile.name}</Text>
              <Text className="text-xs text-podGreen">
                Streak {member.currentStreak} · Last {formatLastCheckIn(member.lastCheckIn?.createdAt)}
              </Text>
            </View>
            <StatusChip status={member.status} />
          </View>
        ))
      )}

      {isActive && (
        <View className="mt-6">
          <Button label="Check In" onPress={() => router.push(`/(app)/pod/${id}/check-in`)} />
        </View>
      )}

      {roster.length > 0 && (
        <View className="mt-8">
          <Text className="mb-2 text-lg font-bold text-podDark">Export</Text>
          <Text className="mb-3 text-sm text-podGreen">
            TSV for spreadsheets · Notes format for Apple Notes
          </Text>
          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <Button
                label="Share TSV"
                variant="secondary"
                disabled={exportBusy}
                onPress={() =>
                  runExport(() => sharePodTsvFile(pod, roster), 'TSV file ready to save or share.')
                }
              />
            </View>
            <View className="flex-1">
              <Button
                label="Copy TSV"
                variant="ghost"
                disabled={exportBusy}
                onPress={() =>
                  runExport(() => copyPodTsv(pod, roster), 'TSV copied — paste into Excel or Numbers.')
                }
              />
            </View>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label="Share to Notes"
                variant="secondary"
                disabled={exportBusy}
                onPress={() =>
                  runExport(
                    () => sharePodNotes(pod, roster),
                    'Pick Notes (or another app) from the share sheet.'
                  )
                }
              />
            </View>
            <View className="flex-1">
              <Button
                label="Copy for Notes"
                variant="ghost"
                disabled={exportBusy}
                onPress={() =>
                  runExport(() => copyPodNotes(pod, roster), 'Copied — paste into a new note.')
                }
              />
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}
