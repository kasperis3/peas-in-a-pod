import { View } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import type { MemberStatus } from '@/src/domain/types';

interface PeaAvatarProps {
  status: MemberStatus;
  size?: number;
}

export function PeaAvatar({ status, size = 40 }: PeaAvatarProps) {
  const bright = status === 'checked_in';
  const droopy = status === 'missed';
  const fill = bright ? '#6BCB77' : droopy ? '#8B9A6B' : '#7CB87F';
  const stem = bright ? '#2D6A4F' : '#5A6F5C';
  const offsetY = droopy ? 4 : 0;
  const scaleY = droopy ? 0.88 : 1;

  return (
    <View style={{ width: size, height: size, transform: [{ translateY: offsetY }] }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Ellipse cx="20" cy="28" rx="6" ry="2" fill="rgba(0,0,0,0.08)" />
        <Circle cx="20" cy="22" r="14" fill={fill} transform={`scale(1 ${scaleY})`} origin="20,22" />
        <Circle cx="15" cy="20" r="2.5" fill="#1B4332" opacity={0.5} />
        <Circle cx="25" cy="20" r="2.5" fill="#1B4332" opacity={0.5} />
        <Ellipse cx="20" cy="6" rx="3" ry="6" fill={stem} />
      </Svg>
    </View>
  );
}
