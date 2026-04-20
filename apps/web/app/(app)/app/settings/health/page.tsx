import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HealthSettingsClient } from './health-settings-client';

export const dynamic = 'force-dynamic';

export default async function HealthSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('health_sync_enabled, health_source, last_health_sync')
    .eq('id', user.id)
    .single();

  const [{ data: recentSamples }, { data: wearableConns }] = await Promise.all([
    supabase
      .from('health_samples')
      .select('metric, value, unit, source, sampled_at')
      .eq('user_id', user.id)
      .order('sampled_at', { ascending: false })
      .limit(20),
    supabase
      .from('wearable_connections')
      .select('provider, is_active, last_sync_at, device_name')
      .eq('user_id', user.id),
  ]);

  return (
    <HealthSettingsClient
      userId={user.id}
      enabled={!!profile?.health_sync_enabled}
      source={profile?.health_source ? String(profile.health_source) : null}
      lastSync={
        profile?.last_health_sync ? String(profile.last_health_sync) : null
      }
      recentSamples={(recentSamples || []) as Record<string, unknown>[]}
      wearableConnections={(wearableConns || []) as Record<string, unknown>[]}
    />
  );
}
