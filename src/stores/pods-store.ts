import { create } from 'zustand';
import { getCurrentPeriod, isWithinPeriod } from '@/src/domain/check-in-period';
import type { Pod, PodMemberView } from '@/src/domain/types';
import { getRepositories } from '@/src/data/repositories';

interface PodsState {
  pods: Pod[];
  rosterByPod: Record<string, PodMemberView[]>;
  pendingCount: number;
  loading: boolean;
  fetchPods: (userId: string) => Promise<void>;
  fetchRoster: (podId: string) => Promise<PodMemberView[]>;
  fetchPendingCount: (leaderId: string) => Promise<void>;
}

export const usePodsStore = create<PodsState>((set) => ({
  pods: [],
  rosterByPod: {},
  pendingCount: 0,
  loading: false,

  async fetchPods(userId) {
    set({ loading: true });
    const repos = getRepositories();
    const pods = await repos.pods.listMyPods(userId);
    set({ pods, loading: false });
  },

  async fetchRoster(podId) {
    const repos = getRepositories();
    const roster = await repos.accountability.getPodRoster(podId);
    set((s) => ({ rosterByPod: { ...s.rosterByPod, [podId]: roster } }));
    return roster;
  },

  async fetchPendingCount(leaderId) {
    const repos = getRepositories();
    const pending = await repos.memberships.listPendingForLeader(leaderId);
    set({ pendingCount: pending.length });
  },
}));

export function getTodaysCheckInPods(pods: Pod[], userId: string, rosterByPod: Record<string, PodMemberView[]>) {
  return pods.filter((pod) => {
    const roster = rosterByPod[pod.id];
    if (!roster) return true;
    const me = roster.find((m) => m.membership.userId === userId);
    if (!me) return true;
    return me.status !== 'checked_in';
  });
}
