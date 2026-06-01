import { Pressable, Text, View } from 'react-native';
import type { Pod } from '@/src/domain/types';
import { PeaAvatar } from './PeaAvatar';
import type { MemberStatus } from '@/src/domain/types';

interface PodCardProps {
  pod: Pod;
  streak?: number;
  status?: MemberStatus;
  onPress: () => void;
}

export function PodCard({ pod, streak = 0, status = 'due_soon', onPress }: PodCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-podGreen/15 bg-white p-4 active:opacity-90"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-lg font-bold text-podDark">{pod.name}</Text>
          <Text className="mt-1 text-sm text-podGreen">
            {pod.goalName} · {pod.cadenceType}
          </Text>
        </View>
        <PeaAvatar status={status} size={44} />
      </View>
      {streak > 0 && (
        <Text className="mt-2 text-sm font-medium text-podGreen">{streak} day streak — keep growing</Text>
      )}
    </Pressable>
  );
}
