import type { CheckIn, SubmitCheckInInput } from '@/src/domain/types';
import { mapCheckIn } from '@/src/data/mappers';
import { getSupabase } from '@/src/data/supabase';
import type { CheckInRepository } from './types';

export function createSupabaseCheckInRepository(): CheckInRepository {
  const supabase = getSupabase();

  return {
    async submit(input, userId) {
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          pod_id: input.podId,
          user_id: userId,
          value: input.value,
          note: input.note ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return mapCheckIn(data);
    },

    async listForPod(podId) {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('pod_id', podId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapCheckIn);
    },

    async listForUser(userId) {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapCheckIn);
    },
  };
}
