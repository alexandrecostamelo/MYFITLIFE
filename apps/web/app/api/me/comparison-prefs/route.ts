import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  share_stats: z.boolean().optional(),
  share_workouts: z.boolean().optional(),
  share_skills: z.boolean().optional(),
  share_weight: z.boolean().optional(),
  share_progress_photos: z.boolean().optional(),
  share_biomarkers: z.boolean().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('comparison_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ prefs: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  await supabase.from('comparison_preferences').upsert({
    user_id: user.id,
    ...parsed.data,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return NextResponse.json({ ok: true });
}
