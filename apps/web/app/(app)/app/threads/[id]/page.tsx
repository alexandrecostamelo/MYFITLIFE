import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RealtimeChatClient } from './chat-client';

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: thread } = await supabase
    .from('professional_threads')
    .select('id, client_id, professional_id')
    .eq('id', id)
    .single();

  if (!thread) redirect('/app/threads');

  const isClient = thread.client_id === user.id;

  const [profRes, clientRes] = await Promise.all([
    supabase
      .from('professionals')
      .select('id, full_name, avatar_url, user_id')
      .eq('id', thread.professional_id)
      .single(),
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', thread.client_id)
      .single(),
  ]);

  const isProfessional = profRes.data?.user_id === user.id;
  if (!isClient && !isProfessional) redirect('/app/threads');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const other: any = isClient ? profRes.data : clientRes.data;

  return (
    <RealtimeChatClient
      threadId={id}
      currentUserId={user.id}
      otherUserName={other?.full_name || 'Usuário'}
      otherUserAvatar={other?.avatar_url ?? null}
    />
  );
}
