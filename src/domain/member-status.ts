import { getCurrentPeriod, getPeriodProgress, isWithinPeriod } from './check-in-period';
import type { CheckIn, MemberStatus, Pod } from './types';

const DUE_SOON_THRESHOLD = 0.75;

export function getMemberStatus(
  pod: Pod,
  checkIns: CheckIn[],
  now: Date = new Date(),
  anchor?: Date
): MemberStatus {
  const period = getCurrentPeriod(pod, now, anchor);
  const periodCheckIn = checkIns.find((c) => isWithinPeriod(c, period));

  if (periodCheckIn) return 'checked_in';

  const progress = getPeriodProgress(period, now);
  if (progress >= 1) return 'missed';
  if (progress >= DUE_SOON_THRESHOLD) return 'due_soon';
  return 'due_soon';
}

export function statusLabel(status: MemberStatus): string {
  switch (status) {
    case 'checked_in':
      return 'Checked In';
    case 'due_soon':
      return 'Due Soon';
    case 'missed':
      return 'Missed';
  }
}
