import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAchievements } from '@/lib/gamification';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await checkAchievements(supabase, user.id);

  const { data: all } = await supabase.from('achievements').select('*');
  const { data: mine } = await supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', user.id);

  const mineMap = new Map((mine || []).map((m: any) => [m.achievement_id, m.unlocked_at]));

  return NextResponse.json({
    achievements: (all || []).map((a: any) => ({ ...a, unlocked: mineMap.has(a.id), unlocked_at: mineMap.get(a.id) || null })),
    total: all?.length || 0,
    unlocked_count: mine?.length || 0,
  });
}
