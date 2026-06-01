import { getCurrentPeriod, isWithinPeriod } from './check-in-period';
import type { CheckIn, Membership, Pod } from './types';

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  graceUsedThisMonth: number;
  graceMonthKey: string;
}

function currentMonthKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Recompute streak from check-in history for skateboard MVP (client-side). */
export function computeStreakFromCheckIns(
  pod: Pod,
  checkIns: CheckIn[],
  graceMissesPerMonth: number,
  now: Date = new Date()
): StreakState {
  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let graceUsed = 0;
  const monthKey = currentMonthKey(now);

  if (sorted.length === 0) {
    return { currentStreak: 0, longestStreak: 0, graceUsedThisMonth: 0, graceMonthKey: monthKey };
  }

  const anchor = new Date(pod.createdAt);
  let cursor = new Date(now);
  let streak = 0;
  let maxStreak = 0;

  for (let i = 0; i < 52; i++) {
    const period = getCurrentPeriod(pod, cursor, anchor);
    const hasCheckIn = sorted.some((c) => isWithinPeriod(c, period));

    if (hasCheckIn) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      const periodEnded = period.end.getTime() < now.getTime();
      if (periodEnded) {
        if (graceUsed < graceMissesPerMonth) {
          graceUsed++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    cursor = new Date(period.start.getTime() - 86400000);
  }

  currentStreak = streak;
  longestStreak = Math.max(maxStreak, streak);

  return {
    currentStreak,
    longestStreak,
    graceUsedThisMonth: graceUsed,
    graceMonthKey: monthKey,
  };
}

export function mergeMembershipStreak(
  membership: Membership,
  computed: StreakState
): Membership {
  return {
    ...membership,
    currentStreak: Math.max(membership.currentStreak, computed.currentStreak),
    longestStreak: Math.max(membership.longestStreak, computed.longestStreak),
    graceUsedThisMonth: computed.graceUsedThisMonth,
    graceMonthKey: computed.graceMonthKey,
  };
}
