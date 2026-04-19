import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  increment: z.record(z.number()).optional(),
  value: z.number().optional(),
  field: z.string().optional(),
});

export async function POST(req: NextRequest, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const [nodeRes, skillRes] = await Promise.all([
    supabase.from('skill_nodes').select('*').eq('key', key).single(),
    supabase.from('user_skills').select('*').eq('user_id', user.id).eq('skill_key', key).maybeSingle(),
  ]);

  const node = nodeRes.data;
  const current = skillRes.data;
  if (!node) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!current) return NextResponse.json({ error: 'not_initialized' }, { status: 400 });
  if (current.status === 'locked') return NextResponse.json({ error: 'still_locked' }, { status: 400 });

  const progress: Record<string, number> = { ...(current.progress || {}) };

  if (parsed.data.increment) {
    for (const [k, v] of Object.entries(parsed.data.increment)) {
      progress[k] = (Number(progress[k]) || 0) + v;
    }
  }
  if (parsed.data.field && parsed.data.value !== undefined) {
    progress[parsed.data.field] = Math.max(Number(progress[parsed.data.field]) || 0, parsed.data.value);
  }
  progress.sessions_practiced = (Number(progress.sessions_practiced) || 0) + 1;

  let newStatus = current.status;
  const updates: Record<string, unknown> = { progress };

  if (current.status === 'available') {
    newStatus = 'in_progress';
    updates.status = newStatus;
    updates.first_practice_at = new Date().toISOString();
  }

  const mc = node.mastery_criteria || {};
  const met =
    Object.keys(mc).length > 0 &&
    Object.entries(mc).every(([k, target]) => Number(progress[k] ?? 0) >= Number(target));

  let justMastered = false;
  if (met && current.status !== 'mastered') {
    newStatus = 'mastered';
    updates.status = 'mastered';
    updates.mastered_at = new Date().toISOString();
    justMastered = true;
  }

  await supabase.from('user_skills').update(updates).eq('id', current.id);

  if (justMastered) {
    try {
      await supabase.rpc('grant_xp', {
        p_user_id: user.id,
        p_amount: node.xp_on_mastery,
        p_source: 'skill_mastery',
        p_dimension: node.category,
      });
    } catch { /* best-effort */ }

    await supabase.rpc('unlock_skills_for', { p_user_id: user.id });
  }

  return NextResponse.json({
    status: newStatus,
    progress,
    just_mastered: justMastered,
    xp_awarded: justMastered ? node.xp_on_mastery : 0,
  });
}
