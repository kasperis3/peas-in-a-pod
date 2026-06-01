import { getCurrentPeriod, isWithinPeriod } from '@/src/domain/check-in-period';
import { getMemberStatus } from '@/src/domain/member-status';
import { computeStreakFromCheckIns, mergeMembershipStreak } from '@/src/domain/streak';
import type {
  CheckIn,
  CreatePodInput,
  InviteCode,
  Membership,
  Pod,
  PodMemberView,
  Profile,
  SubmitCheckInInput,
} from '@/src/domain/types';
import type { AppRepositories } from './types';

function id(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const store = {
  currentUserId: null as string | null,
  profiles: [] as Profile[],
  pods: [] as Pod[],
  memberships: [] as Membership[],
  checkIns: [] as CheckIn[],
  inviteCodes: [] as InviteCode[],
  passwordByEmail: new Map<string, string>(),
};

function randomCode(): string {
  return `PEA-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function createLocalRepositories(): AppRepositories {
  return {
    auth: {
      async signUp(email, password, name) {
        const existing = store.profiles.find((p) => p.email === email);
        if (existing) throw new Error('Account already exists');
        const userId = id();
        store.profiles.push({
          id: userId,
          name,
          email,
          avatarUrl: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        store.passwordByEmail.set(email, password);
        store.currentUserId = userId;
      },
      async signIn(email, password) {
        if (store.passwordByEmail.get(email) !== password) {
          throw new Error('Invalid email or password');
        }
        const profile = store.profiles.find((p) => p.email === email);
        if (!profile) throw new Error('Account not found');
        store.currentUserId = profile.id;
      },
      async signOut() {
        store.currentUserId = null;
      },
      async getSession() {
        if (!store.currentUserId) return null;
        return { userId: store.currentUserId };
      },
      async getProfile() {
        if (!store.currentUserId) return null;
        return store.profiles.find((p) => p.id === store.currentUserId) ?? null;
      },
      async updateProfile(updates) {
        const p = store.profiles.find((x) => x.id === store.currentUserId);
        if (!p) throw new Error('Not authenticated');
        if (updates.name) p.name = updates.name;
        if (updates.timezone) p.timezone = updates.timezone;
        return p;
      },
      onAuthStateChange(callback) {
        callback(store.currentUserId);
        return () => {};
      },
    },

    pods: {
      async createPod(input, leaderId) {
        const pod: Pod = {
          id: id(),
          name: input.name,
          description: input.description ?? '',
          leaderId,
          goalName: input.goalName,
          goalType: input.goalType,
          targetValue: input.targetValue,
          unit: input.unit,
          cadenceType: input.cadenceType,
          cadenceInterval: input.cadenceInterval ?? null,
          graceMissesPerMonth: 2,
          maxMembers: 10,
          createdAt: new Date().toISOString(),
        };
        store.pods.push(pod);
        store.memberships.push({
          id: id(),
          podId: pod.id,
          userId: leaderId,
          status: 'active',
          joinedAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          currentStreak: 0,
          longestStreak: 0,
          graceUsedThisMonth: 0,
          graceMonthKey: new Date().toISOString().slice(0, 7),
        });
        return pod;
      },
      async listMyPods(userId) {
        const podIds = store.memberships
          .filter((m) => m.userId === userId && ['active', 'pending'].includes(m.status))
          .map((m) => m.podId);
        return store.pods.filter((p) => podIds.includes(p.id));
      },
      async getPod(podId) {
        return store.pods.find((p) => p.id === podId) ?? null;
      },
      async leavePod(podId, userId) {
        const m = store.memberships.find((x) => x.podId === podId && x.userId === userId);
        if (m) m.status = 'left';
      },
    },

    memberships: {
      async getMembership(podId, userId) {
        return store.memberships.find((m) => m.podId === podId && m.userId === userId) ?? null;
      },
      async listPodMemberships(podId) {
        return store.memberships.filter(
          (m) => m.podId === podId && ['active', 'pending'].includes(m.status)
        );
      },
      async listPendingForLeader(leaderId) {
        const leaderPods = store.pods.filter((p) => p.leaderId === leaderId).map((p) => p.id);
        return store.memberships
          .filter((m) => leaderPods.includes(m.podId) && m.status === 'pending')
          .map((m) => ({
            ...m,
            pod: store.pods.find((p) => p.id === m.podId)!,
          }));
      },
      async approve(membershipId) {
        const m = store.memberships.find((x) => x.id === membershipId);
        if (!m) throw new Error('Not found');
        m.status = 'active';
        m.approvedAt = new Date().toISOString();
        return m;
      },
      async reject(membershipId) {
        const m = store.memberships.find((x) => x.id === membershipId);
        if (m) m.status = 'rejected';
      },
    },

    checkIns: {
      async submit(input, userId) {
        const membership = store.memberships.find(
          (m) => m.podId === input.podId && m.userId === userId && m.status === 'active'
        );
        if (!membership) throw new Error('You must be an active member to check in');

        const checkIn: CheckIn = {
          id: id(),
          userId,
          podId: input.podId,
          value: input.value,
          note: input.note ?? null,
          createdAt: new Date().toISOString(),
        };
        store.checkIns.unshift(checkIn);
        return checkIn;
      },
      async listForPod(podId) {
        return store.checkIns.filter((c) => c.podId === podId);
      },
      async listForUser(userId) {
        return store.checkIns.filter((c) => c.userId === userId);
      },
    },

    invites: {
      async generateCode(podId, leaderId) {
        store.inviteCodes.filter((c) => c.podId === podId).forEach((c) => (c.active = false));
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        const code: InviteCode = {
          id: id(),
          podId,
          code: randomCode(),
          expiresAt: expires.toISOString(),
          active: true,
        };
        store.inviteCodes.push(code);
        return code;
      },
      async getActiveCode(podId) {
        const now = Date.now();
        return (
          store.inviteCodes.find(
            (c) => c.podId === podId && c.active && new Date(c.expiresAt).getTime() > now
          ) ?? null
        );
      },
      async redeemCode(code, userId) {
        const normalized = code.trim().toUpperCase();
        const invite = store.inviteCodes.find(
          (c) => c.code === normalized && c.active && new Date(c.expiresAt) > new Date()
        );
        if (!invite) throw new Error('Invalid or expired invite code');
        if (store.memberships.some((m) => m.podId === invite.podId && m.userId === userId)) {
          throw new Error('You already requested or joined this pod');
        }
        const membership: Membership = {
          id: id(),
          podId: invite.podId,
          userId,
          status: 'pending',
          joinedAt: new Date().toISOString(),
          approvedAt: null,
          currentStreak: 0,
          longestStreak: 0,
          graceUsedThisMonth: 0,
          graceMonthKey: new Date().toISOString().slice(0, 7),
        };
        store.memberships.push(membership);
        return membership;
      },
    },

    accountability: {
      async getPodRoster(podId) {
        const pod = store.pods.find((p) => p.id === podId);
        if (!pod) throw new Error('Pod not found');
        const active = store.memberships.filter((m) => m.podId === podId && m.status === 'active');
        const allCheckIns = store.checkIns.filter((c) => c.podId === podId);
        const period = getCurrentPeriod(pod);

        return active.map((membership) => {
          const userCheckIns = allCheckIns.filter((c) => c.userId === membership.userId);
          const streak = computeStreakFromCheckIns(pod, userCheckIns, pod.graceMissesPerMonth);
          const merged = mergeMembershipStreak(membership, streak);
          const profile = store.profiles.find((p) => p.id === membership.userId);
          return {
            membership: merged,
            profile: profile ?? {
              id: membership.userId,
              name: 'Pea',
              email: '',
              avatarUrl: null,
              timezone: 'America/New_York',
            },
            status: getMemberStatus(pod, userCheckIns),
            currentStreak: merged.currentStreak,
            longestStreak: merged.longestStreak,
            lastCheckIn: userCheckIns[0] ?? null,
            periodCheckIn: userCheckIns.find((c) => isWithinPeriod(c, period)) ?? null,
          } satisfies PodMemberView;
        });
      },
    },
  };
}

export function seedLocalDemoUser() {
  if (store.profiles.length > 0) return;
  const userId = 'demo-user';
  store.profiles.push({
    id: userId,
    name: 'Demo Pea',
    email: 'demo@peas.app',
    avatarUrl: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  store.passwordByEmail.set('demo@peas.app', 'demo1234');
}
