import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { AdminSidebar } from './admin-sidebar';

export const metadata = { title: 'Admin — MyFitLife' };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!(await isPlatformAdmin(supabase, user.id))) redirect('/app');

  return (
    <div className="flex min-h-screen bg-[#08080d]">
      <AdminSidebar />
      <div className="flex-1 ml-60 min-h-screen pb-24 md:pb-6">{children}</div>
    </div>
  );
}
