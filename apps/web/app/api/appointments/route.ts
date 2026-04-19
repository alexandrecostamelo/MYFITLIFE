import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  professional_id: z.string().uuid(),
  scheduled_at: z.string(),
  duration_min: z.number().int().min(15).max(240).default(60),
  modality: z.enum(['online', 'presencial', 'domiciliar']).optional(),
  client_notes: z.string().max(1000).optional(),
  share_history: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const role = req.nextUrl.searchParams.get('role') || 'client';
  const status = req.nextUrl.searchParams.get('status');

  let query = supabase
    .from('appointments')
    .select('*')
    .order('scheduled_at', { ascending: false })
    .limit(100);

  if (role === 'client') {
    query = query.eq('client_id', user.id);
  } else {
    const { data: prof } = await supabase.from('professionals').select('id').eq('user_id', user.id).single();
    if (!prof) return NextResponse.json({ appointments: [] });
    query = query.eq('professional_id', prof.id);
  }

  if (status) query = query.eq('status', status);

  const { data: appointments } = await query;

  const professionalIds: string[] = [];
  const clientIds: string[] = [];

  (appointments || []).forEach((a: any) => {
    if (role === 'client') professionalIds.push(a.professional_id);
    else clientIds.push(a.client_id);
  });

  const [profsRes, profilesRes] = await Promise.all([
    professionalIds.length > 0
      ? supabase.from('professionals').select('id, full_name, avatar_url, profession').in('id', Array.from(new Set(professionalIds)))
      : Promise.resolve({ data: [] }),
    clientIds.length > 0
      ? supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', Array.from(new Set(clientIds)))
      : Promise.resolve({ data: [] }),
  ]);

  const profMap = new Map((profsRes.data || []).map((p: any) => [p.id, p]));
  const clientMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));

  const enriched = (appointments || []).map((a: any) => ({
    ...a,
    professional: profMap.get(a.professional_id) || null,
    client: clientMap.get(a.client_id) || null,
  }));

  return NextResponse.json({ appointments: enriched });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const scheduledAt = new Date(parsed.data.scheduled_at);
  if (scheduledAt.getTime() < Date.now()) return NextResponse.json({ error: 'past_date' }, { status: 400 });

  const { data: conflict } = await supabase
    .from('appointments')
    .select('id')
    .eq('professional_id', parsed.data.professional_id)
    .eq('scheduled_at', parsed.data.scheduled_at)
    .in('status', ['requested', 'confirmed'])
    .maybeSingle();

  if (conflict) return NextResponse.json({ error: 'slot_taken' }, { status: 409 });

  const { data: prof } = await supabase
    .from('professionals')
    .select('price_consultation, modalities')
    .eq('id', parsed.data.professional_id)
    .single();

  const { data: created, error } = await supabase
    .from('appointments')
    .insert({
      professional_id: parsed.data.professional_id,
      client_id: user.id,
      scheduled_at: parsed.data.scheduled_at,
      duration_min: parsed.data.duration_min,
      modality: parsed.data.modality,
      client_notes: parsed.data.client_notes,
      price: prof?.price_consultation,
      share_history: parsed.data.share_history,
      status: 'requested',
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: created.id });
}
