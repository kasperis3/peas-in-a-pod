import type { InviteCode, Membership } from '@/src/domain/types';
import { mapInviteCode, mapMembership, mapPod } from '@/src/data/mappers';
import { getSupabase } from '@/src/data/supabase';
import type { InviteRepository } from './types';

function randomCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `PEA-${n}`;
}

export function createSupabaseInviteRepository(): InviteRepository {
  const supabase = getSupabase();

  return {
    async generateCode(podId, leaderId) {
      await supabase
        .from('invite_codes')
        .update({ active: false })
        .eq('pod_id', podId);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('invite_codes')
        .insert({
          pod_id: podId,
          code: randomCode(),
          expires_at: expiresAt.toISOString(),
          active: true,
          created_by: leaderId,
        })
        .select()
        .single();
      if (error) throw error;
      return mapInviteCode(data);
    },

    async getActiveCode(podId) {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('pod_id', podId)
        .eq('active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? mapInviteCode(data) : null;
    },

    async redeemCode(code, userId) {
      const normalized = code.trim().toUpperCase();
      const { data: invite, error: iErr } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', normalized)
        .eq('active', true)
        .gt('expires_at', new Date().toISOString())
        .single();
      if (iErr) throw new Error('Invalid or expired invite code');

      const { data: existing } = await supabase
        .from('memberships')
        .select('id')
        .eq('pod_id', invite.pod_id)
        .eq('user_id', userId)
        .maybeSingle();
      if (existing) throw new Error('You already requested or joined this pod');

      const { count: activeCount } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('pod_id', invite.pod_id)
        .eq('status', 'active');
      const { data: pod } = await supabase.from('pods').select('max_members').eq('id', invite.pod_id).single();
      if (pod && activeCount !== null && activeCount >= pod.max_members) {
        throw new Error('This pod is full');
      }

      const { data, error } = await supabase
        .from('memberships')
        .insert({
          pod_id: invite.pod_id,
          user_id: userId,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return mapMembership(data);
    },
  };
}
