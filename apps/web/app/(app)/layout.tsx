import { BottomNav } from '@/components/bottom-nav';
import { DeepLinkHandler } from '@/components/deep-link-handler';
import { PushBootstrap } from '@/components/push-bootstrap';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-background pb-24">
      <DeepLinkHandler />
      <PushBootstrap />
      {children}
      <BottomNav />
    </div>
  );
}
