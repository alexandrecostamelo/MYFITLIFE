import { BottomNav } from '@/components/bottom-nav';
import { DeepLinkHandler } from '@/components/deep-link-handler';
import { PushBootstrap } from '@/components/push-bootstrap';
import { HealthAutoSync } from '@/components/health/auto-sync';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: healthProfile } = await supabase
    .from('profiles')
    .select('health_sync_enabled')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-background pb-24">
      <DeepLinkHandler />
      <PushBootstrap />
      <HealthAutoSync userId={user.id} enabled={!!healthProfile?.health_sync_enabled} />
      {children}
      <BottomNav />
    </div>
  );
}
