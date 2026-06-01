import { isSupabaseConfigured } from '@/src/data/supabase';
import { createLocalRepositories, seedLocalDemoUser } from './local';
import { createSupabaseAccountabilityRepository } from './supabase-accountability';
import { createSupabaseAuthRepository } from './supabase-auth';
import { createSupabaseCheckInRepository } from './supabase-checkins';
import { createSupabaseInviteRepository } from './supabase-invites';
import {
  createSupabaseMembershipRepository,
  createSupabasePodRepository,
} from './supabase-pods';
import type { AppRepositories } from './types';

let cached: AppRepositories | null = null;

export function getRepositories(): AppRepositories {
  if (cached) return cached;

  const useLocal =
    process.env.EXPO_PUBLIC_DATA_SOURCE === 'local' || !isSupabaseConfigured();

  if (useLocal) {
    seedLocalDemoUser();
    cached = createLocalRepositories();
    return cached;
  }

  cached = {
    auth: createSupabaseAuthRepository(),
    pods: createSupabasePodRepository(),
    memberships: createSupabaseMembershipRepository(),
    checkIns: createSupabaseCheckInRepository(),
    invites: createSupabaseInviteRepository(),
    accountability: createSupabaseAccountabilityRepository(),
  };
  return cached;
}

export function usesLocalData(): boolean {
  return process.env.EXPO_PUBLIC_DATA_SOURCE === 'local' || !isSupabaseConfigured();
}
