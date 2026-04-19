import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: parsed.data.endpoint,
    keys_p256dh: parsed.data.keys.p256dh,
    keys_auth: parsed.data.keys.auth,
    user_agent: req.headers.get('user-agent'),
    last_used_at: new Date().toISOString(),
  }, { onConflict: 'user_id,endpoint' });

  await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id, push_enabled: true }, { onConflict: 'user_id' });

  return NextResponse.json({ ok: true });
}
