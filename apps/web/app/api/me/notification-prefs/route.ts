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
  // Social push preferences
  push_friend_request: z.boolean().optional(),
  push_friend_workout: z.boolean().optional(),
  push_challenge_invite: z.boolean().optional(),
  push_chat_message: z.boolean().optional(),
  push_friend_achievement: z.boolean().optional(),
});

const SOCIAL_PUSH_KEYS = [
  'push_friend_request',
  'push_friend_workout',
  'push_challenge_invite',
  'push_chat_message',
  'push_friend_achievement',
] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [{ data: prefs }, { data: socialPrefs }] = await Promise.all([
    supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
  ]);

  return NextResponse.json({ prefs: { ...prefs, ...socialPrefs } });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const socialData: Record<string, boolean> = {};
  const baseData: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(parsed.data)) {
    if (SOCIAL_PUSH_KEYS.includes(k as typeof SOCIAL_PUSH_KEYS[number])) {
      socialData[k] = v as boolean;
    } else {
      baseData[k] = v;
    }
  }

  await Promise.all([
    Object.keys(baseData).length > 0
      ? supabase.from('notification_preferences').upsert({
          user_id: user.id,
          ...baseData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      : Promise.resolve(),
    Object.keys(socialData).length > 0
      ? supabase.from('user_notification_preferences').upsert({
          user_id: user.id,
          ...socialData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      : Promise.resolve(),
  ]);
  return NextResponse.json({ ok: true });
}
