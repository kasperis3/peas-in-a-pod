import type { Profile } from '@/src/domain/types';
import { mapProfile } from '@/src/data/mappers';
import { getSupabase } from '@/src/data/supabase';
import type { AuthRepository } from './types';
import type { User } from '@supabase/supabase-js';

function profileFromUser(user: User) {
  const name =
    (user.user_metadata?.name as string) ||
    user.email?.split('@')[0] ||
    'Pea';
  const email = user.email ?? '';
  return { id: user.id, name, email };
}

async function ensureProfile(user: User): Promise<Profile> {
  const supabase = getSupabase();

  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) {
    if (selectError.code === 'PGRST205') {
      throw new Error(
        'Database not set up. Run supabase/migrations/00001_skateboard.sql in the Supabase SQL Editor.'
      );
    }
    throw selectError;
  }

  if (existing) return mapProfile(existing);

  const row = profileFromUser(user);
  const { data: upserted, error: upsertError } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (!upsertError && upserted) return mapProfile(upserted);

  // Race: trigger created row between select and upsert
  if (upsertError?.code === '23505') {
    const { data: retry, error: retryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (retry) return mapProfile(retry);
    if (retryError) throw retryError;
  }

  if (upsertError) throw upsertError;
  throw new Error('Could not load profile');
}

export function createSupabaseAuthRepository(): AuthRepository {
  const supabase = getSupabase();

  return {
    async signUp(email, password, name) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      if (data.user) {
        try {
          await ensureProfile(data.user);
        } catch {
          /* trigger may have created it; sign-in will retry */
        }
      }
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
      const { data: session } = await supabase.auth.getSession();
      const user = session.session?.user;
      if (!user) return null;
      return ensureProfile(user);
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
