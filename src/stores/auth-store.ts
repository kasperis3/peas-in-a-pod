import { create } from 'zustand';
import { getRepositories } from '@/src/data/repositories';
import type { Profile } from '@/src/domain/types';

interface AuthState {
  userId: string | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  profile: null,
  loading: false,
  initialized: false,
  error: null,

  async initialize() {
    const repos = getRepositories();
    const session = await repos.auth.getSession();
    if (session) {
      const profile = await repos.auth.getProfile();
      set({ userId: session.userId, profile, initialized: true });
    } else {
      set({ userId: null, profile: null, initialized: true });
    }
    repos.auth.onAuthStateChange(async (userId) => {
      if (!userId) {
        set({ userId: null, profile: null });
        return;
      }
      const profile = await repos.auth.getProfile();
      set({ userId, profile });
    });
  },

  async signIn(email, password) {
    set({ loading: true, error: null });
    try {
      const repos = getRepositories();
      await repos.auth.signIn(email, password);
      const session = await repos.auth.getSession();
      const profile = await repos.auth.getProfile();
      set({ userId: session?.userId ?? null, profile, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Sign in failed', loading: false });
      throw e;
    }
  },

  async signUp(email, password, name) {
    set({ loading: true, error: null });
    try {
      const repos = getRepositories();
      await repos.auth.signUp(email, password, name);
      await repos.auth.signIn(email, password);
      const session = await repos.auth.getSession();
      const profile = await repos.auth.getProfile();
      set({ userId: session?.userId ?? null, profile, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Sign up failed', loading: false });
      throw e;
    }
  },

  async signOut() {
    const repos = getRepositories();
    await repos.auth.signOut();
    set({ userId: null, profile: null });
  },

  async refreshProfile() {
    const repos = getRepositories();
    const profile = await repos.auth.getProfile();
    set({ profile });
  },

  clearError() {
    set({ error: null });
  },
}));
