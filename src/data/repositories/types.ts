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

export interface AuthRepository {
  signUp(email: string, password: string, name: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getSession(): Promise<{ userId: string } | null>;
  getProfile(): Promise<Profile | null>;
  updateProfile(updates: Partial<Pick<Profile, 'name' | 'timezone'>>): Promise<Profile>;
  onAuthStateChange(callback: (userId: string | null) => void): () => void;
}

export interface PodRepository {
  createPod(input: CreatePodInput, leaderId: string): Promise<Pod>;
  listMyPods(userId: string): Promise<Pod[]>;
  getPod(podId: string): Promise<Pod | null>;
  leavePod(podId: string, userId: string): Promise<void>;
}

export interface MembershipRepository {
  getMembership(podId: string, userId: string): Promise<Membership | null>;
  listPodMemberships(podId: string): Promise<Membership[]>;
  listPendingForLeader(leaderId: string): Promise<(Membership & { pod: Pod })[]>;
  approve(membershipId: string): Promise<Membership>;
  reject(membershipId: string): Promise<void>;
}

export interface CheckInRepository {
  submit(input: SubmitCheckInInput, userId: string): Promise<CheckIn>;
  listForPod(podId: string): Promise<CheckIn[]>;
  listForUser(userId: string): Promise<CheckIn[]>;
}

export interface InviteRepository {
  generateCode(podId: string, leaderId: string): Promise<InviteCode>;
  getActiveCode(podId: string): Promise<InviteCode | null>;
  redeemCode(code: string, userId: string): Promise<Membership>;
}

export interface AccountabilityRepository {
  getPodRoster(podId: string): Promise<PodMemberView[]>;
}

export interface AppRepositories {
  auth: AuthRepository;
  pods: PodRepository;
  memberships: MembershipRepository;
  checkIns: CheckInRepository;
  invites: InviteRepository;
  accountability: AccountabilityRepository;
}
