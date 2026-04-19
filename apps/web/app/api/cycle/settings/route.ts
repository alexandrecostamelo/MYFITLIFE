import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  tracking_enabled: z.boolean(),
  average_cycle_length: z.number().int().min(21).max(45).optional(),
  average_period_length: z.number().int().min(2).max(10).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase.from('menstrual_settings').select('*').eq('user_id', user.id).maybeSingle();
  return NextResponse.json({ settings: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  await supabase.from('menstrual_settings').upsert({
    user_id: user.id,
    ...parsed.data,
    last_updated: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return NextResponse.json({ ok: true });
}
