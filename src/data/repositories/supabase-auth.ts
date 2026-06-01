import type { Profile } from '@/src/domain/types';
import { mapProfile } from '@/src/data/mappers';
import { getSupabase } from '@/src/data/supabase';
import type { AuthRepository } from './types';

async function ensureProfile(): Promise<Profile | null> {
  const supabase = getSupabase();

  const { data: session } = await supabase.auth.getSession();
  if (!session.session?.user) return null;

  const { data, error } = await supabase.rpc('ensure_my_profile');

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('ensure_my_profile')) {
      throw new Error(
        'Database not set up. Run migrations 00001–00004 in the Supabase SQL Editor (see README).'
      );
    }
    if (
      error.code === '23503' ||
      error.message?.includes('foreign key') ||
      error.message?.includes('Auth user not found')
    ) {
      await supabase.auth.signOut();
      throw new Error('Session expired. Please sign in again.');
    }
    throw error;
  }

  return mapProfile(data as Record<string, unknown>);
}

export function createSupabaseAuthRepository(): AuthRepository {
  const supabase = getSupabase();

  return {
    async signUp(email, password, name) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
    },

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },

    async getSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) return null;
      return { userId: data.session.user.id };
    },

    async getProfile() {
      return ensureProfile();
    },

    async updateProfile(updates) {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          timezone: updates.timezone,
        })
        .eq('id', session.session.user.id)
        .select()
        .single();
      if (error) throw error;
      return mapProfile(data);
    },

    onAuthStateChange(callback) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user?.id ?? null);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
