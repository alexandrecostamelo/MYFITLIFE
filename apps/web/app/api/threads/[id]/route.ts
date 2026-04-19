import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: thread } = await supabase.from('professional_threads').select('*').eq('id', id).single();
  if (!thread) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const [profRes, clientRes] = await Promise.all([
    supabase.from('professionals').select('id, full_name, avatar_url, profession, user_id').eq('id', thread.professional_id).single(),
    supabase.from('profiles').select('id, full_name, username, avatar_url').eq('id', thread.client_id).single(),
  ]);

  const isClient = thread.client_id === user.id;
  const isProfessional = profRes.data?.user_id === user.id;
  if (!isClient && !isProfessional) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: messages } = await supabase
    .from('professional_messages')
    .select('*')
    .eq('thread_id', id)
    .order('created_at', { ascending: true });

  const unreadFieldToReset = isClient ? 'client_unread' : 'professional_unread';
  await supabase
    .from('professional_threads')
    .update({ [unreadFieldToReset]: 0 })
    .eq('id', id);

  await supabase
    .from('professional_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', id)
    .neq('sender_id', user.id)
    .is('read_at', null);

  return NextResponse.json({
    thread,
    professional: profRes.data,
    client: clientRes.data,
    messages: messages || [],
    i_am_client: isClient,
  });
}
