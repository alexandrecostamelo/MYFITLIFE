import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const sorenessSchema = z.object({
  region: z.string(),
  intensity: z.number().int().min(1).max(5),
});

const bodySchema = z.object({
  sleep_quality: z.number().int().min(1).max(10).optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  energy_level: z.number().int().min(1).max(10).optional(),
  mood: z.number().int().min(1).max(10).optional(),
  stress_level: z.number().int().min(1).max(10).optional(),
  sore_muscles: z.array(z.string()).optional(),
  soreness_details: z.array(sorenessSchema).optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from('morning_checkins')
    .upsert({ user_id: user.id, checkin_date: today, ...parsed.data }, { onConflict: 'user_id,checkin_date' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('morning_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('checkin_date', today)
    .maybeSingle();

  return NextResponse.json({ checkin: data });
}
