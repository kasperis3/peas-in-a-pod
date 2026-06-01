export type GoalType = 'completion' | 'measurement';
export type CadenceType = 'daily' | 'weekly' | 'monthly' | 'every_x_days' | 'every_x_weeks';
export type MembershipStatus = 'pending' | 'active' | 'rejected' | 'left';
export type MemberStatus = 'checked_in' | 'due_soon' | 'missed';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  timezone: string;
}

export interface Pod {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  goalName: string;
  goalType: GoalType;
  targetValue: number;
  unit: string;
  cadenceType: CadenceType;
  cadenceInterval: number | null;
  graceMissesPerMonth: number;
  maxMembers: number;
  createdAt: string;
}

export interface Membership {
  id: string;
  podId: string;
  userId: string;
  status: MembershipStatus;
  joinedAt: string;
  approvedAt: string | null;
  currentStreak: number;
  longestStreak: number;
  graceUsedThisMonth: number;
  graceMonthKey: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  podId: string;
  value: number;
  note: string | null;
  createdAt: string;
}

export interface InviteCode {
  id: string;
  podId: string;
  code: string;
  expiresAt: string;
  active: boolean;
}

export interface PodMemberView {
  membership: Membership;
  profile: Profile;
  status: MemberStatus;
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: CheckIn | null;
  periodCheckIn: CheckIn | null;
}

export interface CreatePodInput {
  name: string;
  description?: string;
  goalName: string;
  goalType: GoalType;
  targetValue: number;
  unit: string;
  cadenceType: CadenceType;
  cadenceInterval?: number | null;
}

export interface SubmitCheckInInput {
  podId: string;
  value: number;
  note?: string;
}
