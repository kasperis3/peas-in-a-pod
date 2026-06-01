import type {
  CadenceType,
  CheckIn,
  GoalType,
  InviteCode,
  Membership,
  MembershipStatus,
  Pod,
  Profile,
} from '@/src/domain/types';

export function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    timezone: row.timezone as string,
  };
}

export function mapPod(row: Record<string, unknown>): Pod {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    leaderId: row.leader_id as string,
    goalName: row.goal_name as string,
    goalType: row.goal_type as GoalType,
    targetValue: Number(row.target_value),
    unit: row.unit as string,
    cadenceType: row.cadence_type as CadenceType,
    cadenceInterval: row.cadence_interval != null ? Number(row.cadence_interval) : null,
    graceMissesPerMonth: Number(row.grace_misses_per_month),
    maxMembers: Number(row.max_members),
    createdAt: row.created_at as string,
  };
}

export function mapMembership(row: Record<string, unknown>): Membership {
  return {
    id: row.id as string,
    podId: row.pod_id as string,
    userId: row.user_id as string,
    status: row.status as MembershipStatus,
    joinedAt: row.joined_at as string,
    approvedAt: (row.approved_at as string | null) ?? null,
    currentStreak: Number(row.current_streak),
    longestStreak: Number(row.longest_streak),
    graceUsedThisMonth: Number(row.grace_used_this_month),
    graceMonthKey: row.grace_month_key as string,
  };
}

export function mapCheckIn(row: Record<string, unknown>): CheckIn {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    podId: row.pod_id as string,
    value: Number(row.value),
    note: (row.note as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapInviteCode(row: Record<string, unknown>): InviteCode {
  return {
    id: row.id as string,
    podId: row.pod_id as string,
    code: row.code as string,
    expiresAt: row.expires_at as string,
    active: row.active as boolean,
  };
}
