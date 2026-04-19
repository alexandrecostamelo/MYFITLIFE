import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createSchema = z.object({ professional_id: z.string().uuid() });

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: myProf } = await supabase.from('professionals').select('id').eq('user_id', user.id).maybeSingle();

  let query = supabase
    .from('professional_threads')
    .select('*')
    .eq('archived', false)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(100);

  if (myProf) {
    query = query.or(`client_id.eq.${user.id},professional_id.eq.${myProf.id}`);
  } else {
    query = query.eq('client_id', user.id);
  }

  const { data: threads } = await query;

  if (!threads || threads.length === 0) return NextResponse.json({ threads: [] });

  const professionalIds = Array.from(new Set(threads.map((t: any) => t.professional_id)));
  const clientIds = Array.from(new Set(threads.map((t: any) => t.client_id)));

  const [profsRes, profilesRes] = await Promise.all([
    supabase.from('professionals').select('id, full_name, avatar_url, profession').in('id', professionalIds),
    supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', clientIds),
  ]);

  const profMap = new Map((profsRes.data || []).map((p: any) => [p.id, p]));
  const clientMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));

  const enriched = threads.map((t: any) => {
    const isClient = t.client_id === user.id;
    return {
      ...t,
      other_user: isClient ? profMap.get(t.professional_id) : clientMap.get(t.client_id),
      my_unread: isClient ? t.client_unread : t.professional_unread,
      i_am_client: isClient,
    };
  });

  return NextResponse.json({ threads: enriched });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data: existing } = await supabase
    .from('professional_threads')
    .select('id')
    .eq('professional_id', parsed.data.professional_id)
    .eq('client_id', user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ id: existing.id });

  const { data, error } = await supabase
    .from('professional_threads')
    .insert({
      professional_id: parsed.data.professional_id,
      client_id: user.id,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
