import { Text, View } from 'react-native';
import { statusLabel } from '@/src/domain/member-status';
import type { MemberStatus } from '@/src/domain/types';

const styles: Record<MemberStatus, { bg: string; text: string }> = {
  checked_in: { bg: 'bg-peaBright/30', text: 'text-podDark' },
  due_soon: { bg: 'bg-dueSoon/40', text: 'text-podDark' },
  missed: { bg: 'bg-peaDroopy/30', text: 'text-podDark' },
};

export function StatusChip({ status }: { status: MemberStatus }) {
  const s = styles[status];
  return (
    <View className={`rounded-full px-2.5 py-1 ${s.bg}`}>
      <Text className={`text-xs font-semibold ${s.text}`}>{statusLabel(status)}</Text>
    </View>
  );
}
