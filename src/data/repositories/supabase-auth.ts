import type { Profile } from '@/src/domain/types';
import { mapProfile } from '@/src/data/mappers';
import { getSupabase } from '@/src/data/supabase';
import type { AuthRepository } from './types';

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
      const { data: session } = await supabase.auth.getSession();
      const user = session.session?.user;
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST205') {
          throw new Error(
            'Database not set up. Run supabase/migrations/00001_skateboard.sql in the Supabase SQL Editor.'
          );
        }
        throw error;
      }

      if (data) return mapProfile(data);

      // User exists in Auth but no profile row (signed up before trigger / manual fix)
      const name =
        (user.user_metadata?.name as string) ||
        user.email?.split('@')[0] ||
        'Pea';
      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name,
          email: user.email ?? '',
        })
        .select()
        .single();
      if (insertError) throw insertError;
      return mapProfile(created);
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
