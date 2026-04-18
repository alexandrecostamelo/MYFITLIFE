import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bodySchema = z.object({
  weight_kg: z.number().min(25).max(400),
  body_fat_percent: z.number().min(3).max(70).optional(),
  notes: z.string().optional(),
  logged_at: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { error } = await supabase.from('weight_logs').insert({
    user_id: user.id,
    weight_kg: parsed.data.weight_kg,
    body_fat_percent: parsed.data.body_fat_percent,
    notes: parsed.data.notes,
    logged_at: parsed.data.logged_at || new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('user_profiles').update({ current_weight_kg: parsed.data.weight_kg }).eq('user_id', user.id);

  const { awardXp, touchActivity, checkAchievements } = await import('@/lib/gamification');
  await awardXp(supabase, user.id, 'WEIGHT_LOGGED');
  await touchActivity(supabase, user.id);
  await checkAchievements(supabase, user.id);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('weight_logs')
    .select('id, weight_kg, body_fat_percent, notes, logged_at')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(180);

  return NextResponse.json({ logs: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const { error } = await supabase.from('weight_logs').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
