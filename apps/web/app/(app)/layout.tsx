import { BottomNav } from '@/components/bottom-nav';
import { DeepLinkHandler } from '@/components/deep-link-handler';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <DeepLinkHandler />
      {children}
      <BottomNav />
    </div>
  );
}
