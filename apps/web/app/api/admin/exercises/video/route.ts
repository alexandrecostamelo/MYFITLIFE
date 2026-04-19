import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';

const schema = z.object({
  exercise_id: z.string().uuid(),
  video_url: z.string().url().nullable(),
  video_source: z.enum(['youtube', 'direct', 'vimeo']).nullable().optional(),
  pose_check_key: z.enum(['squat', 'push_up', 'plank', 'lunge']).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isPlatformAdmin(supabase, user.id))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const updates: Record<string, unknown> = {
    video_url: parsed.data.video_url,
  };
  if (parsed.data.video_source !== undefined) updates.video_source = parsed.data.video_source;
  if (parsed.data.pose_check_key !== undefined) updates.pose_check_key = parsed.data.pose_check_key;

  const { error } = await supabase
    .from('exercises')
    .update(updates)
    .eq('id', parsed.data.exercise_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
