import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: quest } = await supabase.from('daily_quests').select('*').eq('id', id).eq('user_id', user.id).single();
  if (!quest) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (quest.completed) return NextResponse.json({ ok: true, already: true });

  const { error } = await supabase.from('daily_quests').update({ completed: true, completed_at: new Date().toISOString(), progress: quest.target_value }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { awardXp, checkAchievements } = await import('@/lib/gamification');
  await awardXp(supabase, user.id, 'QUEST_COMPLETED', { refTable: 'daily_quests', refId: id, description: quest.title, multiplier: quest.xp_reward / 30 });
  await checkAchievements(supabase, user.id);

  return NextResponse.json({ ok: true });
}
