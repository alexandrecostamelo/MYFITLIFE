import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  email_enabled: z.boolean().optional(),
  workout_reminder: z.boolean().optional(),
  meal_reminder: z.boolean().optional(),
  water_reminder: z.boolean().optional(),
  sleep_reminder: z.boolean().optional(),
  weekly_summary_email: z.boolean().optional(),
  churn_recovery_email: z.boolean().optional(),
  quiet_hours_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quiet_hours_end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle();
  return NextResponse.json({ prefs: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  await supabase.from('notification_preferences').upsert({
    user_id: user.id,
    ...parsed.data,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return NextResponse.json({ ok: true });
}
