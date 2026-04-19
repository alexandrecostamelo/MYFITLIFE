import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ruleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  slot_duration_min: z.number().int().min(15).max(240).default(60),
});

async function getMyProfId(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase.from('professionals').select('id').eq('user_id', userId).maybeSingle();
  return data?.id || null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const profId = await getMyProfId(supabase, user.id);
  if (!profId) return NextResponse.json({ error: 'not_professional' }, { status: 403 });

  const [availability, blocked] = await Promise.all([
    supabase.from('professional_availability').select('*').eq('professional_id', profId).order('weekday'),
    supabase.from('professional_blocked_dates').select('*').eq('professional_id', profId).gte('blocked_date', new Date().toISOString().slice(0, 10)).order('blocked_date'),
  ]);

  return NextResponse.json({
    availability: availability.data || [],
    blocked_dates: blocked.data || [],
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const profId = await getMyProfId(supabase, user.id);
  if (!profId) return NextResponse.json({ error: 'not_professional' }, { status: 403 });

  const parsed = ruleSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (parsed.data.end_time <= parsed.data.start_time) return NextResponse.json({ error: 'invalid_time_range' }, { status: 400 });

  const { data, error } = await supabase
    .from('professional_availability')
    .insert({
      professional_id: profId,
      weekday: parsed.data.weekday,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      slot_duration_min: parsed.data.slot_duration_min,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
