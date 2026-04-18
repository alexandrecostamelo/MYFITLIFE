import { SupabaseClient } from '@supabase/supabase-js';

export async function getUserRole(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role ?? 'user';
}

export async function isPlatformAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const role = await getUserRole(supabase, userId);
  return role === 'platform_admin';
}

export async function isGymAdminOfPlace(supabase: SupabaseClient, userId: string, gymPlaceId: string): Promise<boolean> {
  const { data } = await supabase
    .from('gym_places')
    .select('claimed_by')
    .eq('id', gymPlaceId)
    .single();
  return data?.claimed_by === userId;
}

export async function canViewGymAnalytics(supabase: SupabaseClient, userId: string, gymPlaceId: string): Promise<boolean> {
  const [admin, gymAdmin] = await Promise.all([
    isPlatformAdmin(supabase, userId),
    isGymAdminOfPlace(supabase, userId, gymPlaceId),
  ]);
  return admin || gymAdmin;
}
