import { getCurrentPeriod, isWithinPeriod } from '@/src/domain/check-in-period';
import { getMemberStatus } from '@/src/domain/member-status';
import { computeStreakFromCheckIns, mergeMembershipStreak } from '@/src/domain/streak';
import type { PodMemberView, Profile } from '@/src/domain/types';
import { mapCheckIn, mapMembership, mapPod, mapProfile } from '@/src/data/mappers';
import { getSupabase } from '@/src/data/supabase';
import type { AccountabilityRepository } from './types';

export function createSupabaseAccountabilityRepository(): AccountabilityRepository {
  const supabase = getSupabase();

  return {
    async getPodRoster(podId) {
      const { data: podRow, error: podErr } = await supabase
        .from('pods')
        .select('*')
        .eq('id', podId)
        .single();
      if (podErr) throw podErr;
      const pod = mapPod(podRow);

      const { data: memberships, error: mErr } = await supabase
        .from('memberships')
        .select('*')
        .eq('pod_id', podId)
        .eq('status', 'active');
      if (mErr) throw mErr;

      const { data: checkIns, error: cErr } = await supabase
        .from('check_ins')
        .select('*')
        .eq('pod_id', podId)
        .order('created_at', { ascending: false });
      if (cErr) throw cErr;

      const userIds = (memberships ?? []).map((m) => m.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      if (pErr) throw pErr;

      const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, mapProfile(p)]));

      const period = getCurrentPeriod(pod);

      return (memberships ?? []).map((row) => {
        const membership = mapMembership(row);
        const userCheckIns = (checkIns ?? [])
          .filter((c) => c.user_id === membership.userId)
          .map(mapCheckIn);
        const streak = computeStreakFromCheckIns(pod, userCheckIns, pod.graceMissesPerMonth);
        const merged = mergeMembershipStreak(membership, streak);
        const periodCheckIn = userCheckIns.find((c) => isWithinPeriod(c, period)) ?? null;
        const lastCheckIn = userCheckIns[0] ?? null;

        return {
          membership: merged,
          profile: profileMap.get(membership.userId) ?? {
            id: membership.userId,
            name: 'Pea',
            email: '',
            avatarUrl: null,
            timezone: 'America/New_York',
          },
          status: getMemberStatus(pod, userCheckIns),
          currentStreak: merged.currentStreak,
          longestStreak: merged.longestStreak,
          lastCheckIn,
          periodCheckIn,
        } satisfies PodMemberView;
      });
    },
  };
}
