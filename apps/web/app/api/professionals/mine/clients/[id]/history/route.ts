import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase.rpc('shared_client_history', { p_client_id: id });

  if (error) {
    if (error.message.includes('no_permission')) {
      return NextResponse.json({ error: 'no_permission', message: 'O cliente não autorizou compartilhar o histórico.' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: clientProfile } = await supabase.from('profiles').select('full_name, username, avatar_url').eq('id', id).single();

  return NextResponse.json({ history: data, client: clientProfile });
}
