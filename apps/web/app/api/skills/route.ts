import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await supabase.rpc('init_user_skills_for', { p_user_id: user.id });
  await supabase.rpc('unlock_skills_for', { p_user_id: user.id });

  const [nodesRes, userSkillsRes] = await Promise.all([
    supabase.from('skill_nodes').select('*').order('category').order('tier').order('order_in_tier'),
    supabase.from('user_skills').select('*').eq('user_id', user.id),
  ]);

  const userMap = new Map((userSkillsRes.data || []).map((u: any) => [u.skill_key, u]));

  const enriched = (nodesRes.data || []).map((n: any) => ({
    ...n,
    user_skill: userMap.get(n.key) ?? { status: 'available', progress: {} },
  }));

  const summary = {
    total: enriched.length,
    mastered: enriched.filter((e: any) => e.user_skill.status === 'mastered').length,
    in_progress: enriched.filter((e: any) => e.user_skill.status === 'in_progress').length,
    available: enriched.filter((e: any) => e.user_skill.status === 'available').length,
    locked: enriched.filter((e: any) => e.user_skill.status === 'locked').length,
  };

  return NextResponse.json({ skills: enriched, summary });
}
