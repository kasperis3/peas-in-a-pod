import type { CreatePodInput, Pod } from '@/src/domain/types';
import { mapMembership, mapPod } from '@/src/data/mappers';
import { getSupabase } from '@/src/data/supabase';
import type { MembershipRepository, PodRepository } from './types';

export function createSupabasePodRepository(): PodRepository {
  const supabase = getSupabase();

  return {
    async createPod(input, leaderId) {
      const { data: pod, error: podError } = await supabase
        .from('pods')
        .insert({
          name: input.name,
          description: input.description ?? '',
          leader_id: leaderId,
          goal_name: input.goalName,
          goal_type: input.goalType,
          target_value: input.targetValue,
          unit: input.unit,
          cadence_type: input.cadenceType,
          cadence_interval: input.cadenceInterval ?? null,
        })
        .select()
        .single();
      if (podError) throw podError;

      const { error: memberError } = await supabase.from('memberships').insert({
        pod_id: pod.id,
        user_id: leaderId,
        status: 'active',
        approved_at: new Date().toISOString(),
      });
      if (memberError) throw memberError;

      return mapPod(pod);
    },

    async listMyPods(userId) {
      const { data: memberships, error: mErr } = await supabase
        .from('memberships')
        .select('pod_id')
        .eq('user_id', userId)
        .in('status', ['active', 'pending']);
      if (mErr) throw mErr;
      if (!memberships?.length) return [];

      const podIds = memberships.map((m) => m.pod_id);
      const { data: pods, error } = await supabase.from('pods').select('*').in('id', podIds);
      if (error) throw error;
      return (pods ?? []).map(mapPod);
    },

    async getPod(podId) {
      const { data, error } = await supabase.from('pods').select('*').eq('id', podId).single();
      if (error) return null;
      return mapPod(data);
    },

    async leavePod(podId, userId) {
      const { error } = await supabase
        .from('memberships')
        .update({ status: 'left' })
        .eq('pod_id', podId)
        .eq('user_id', userId);
      if (error) throw error;
    },
  };
}

export function createSupabaseMembershipRepository(): MembershipRepository {
  const supabase = getSupabase();

  return {
    async getMembership(podId, userId) {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('pod_id', podId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapMembership(data) : null;
    },

    async listPodMemberships(podId) {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('pod_id', podId)
        .in('status', ['active', 'pending']);
      if (error) throw error;
      return (data ?? []).map(mapMembership);
    },

    async listPendingForLeader(leaderId) {
      const { data: pods, error: pErr } = await supabase
        .from('pods')
        .select('id')
        .eq('leader_id', leaderId);
      if (pErr) throw pErr;
      if (!pods?.length) return [];

      const podIds = pods.map((p) => p.id);
      const { data, error } = await supabase
        .from('memberships')
        .select('*, pods(*)')
        .in('pod_id', podIds)
        .eq('status', 'pending');
      if (error) throw error;

      return (data ?? []).map((row) => ({
        ...mapMembership(row),
        pod: mapPod(row.pods as Record<string, unknown>),
      }));
    },

    async approve(membershipId) {
      const { data, error } = await supabase
        .from('memberships')
        .update({ status: 'active', approved_at: new Date().toISOString() })
        .eq('id', membershipId)
        .select()
        .single();
      if (error) throw error;
      return mapMembership(data);
    },

    async reject(membershipId) {
      const { error } = await supabase
        .from('memberships')
        .update({ status: 'rejected' })
        .eq('id', membershipId);
      if (error) throw error;
    },
  };
}
