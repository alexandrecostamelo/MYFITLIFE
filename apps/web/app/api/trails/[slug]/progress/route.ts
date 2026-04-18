import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bodySchema = z.object({
  action: z.enum(['complete_day', 'abandon', 'resume']),
  day: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data: trail } = await supabase.from('trails').select('id, duration_days').eq('slug', slug).single();
  if (!trail) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: ut } = await supabase
    .from('user_trails')
    .select('*')
    .eq('user_id', user.id)
    .eq('trail_id', trail.id)
    .single();

  if (!ut) return NextResponse.json({ error: 'not_enrolled' }, { status: 400 });

  if (parsed.data.action === 'complete_day') {
    const day = parsed.data.day || ut.current_day;
    const daysCompleted: number[] = Array.from(new Set([...(ut.days_completed || []), day]));
    const nextDay = Math.min(trail.duration_days, day + 1);
    const completed = daysCompleted.length >= trail.duration_days;

    const { error } = await supabase
      .from('user_trails')
      .update({
        days_completed: daysCompleted,
        current_day: nextDay,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', ut.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { awardXp: axp, checkAchievements: cka } = await import('@/lib/gamification');
    await axp(supabase, user.id, 'TRAIL_DAY', { refTable: 'user_trails', refId: ut.id });
    if (completed) await axp(supabase, user.id, 'TRAIL_COMPLETED', { refTable: 'user_trails', refId: ut.id });
    await cka(supabase, user.id);
    return NextResponse.json({ ok: true, completed });
  }

  if (parsed.data.action === 'abandon') {
    await supabase.from('user_trails').update({ abandoned: true }).eq('id', ut.id);
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === 'resume') {
    await supabase.from('user_trails').update({ abandoned: false }).eq('id', ut.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
}
