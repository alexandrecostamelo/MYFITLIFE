import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Dados do amigo via RPC (valida amizade + respeita prefs)
  const { data: friendRpc, error: friendErr } = await supabase.rpc('friend_comparison_data', {
    p_friend_id: id,
    p_days: days,
  });

  if (friendErr) {
    if (friendErr.message.includes('not_friends')) {
      return NextResponse.json({ error: 'not_friends' }, { status: 403 });
    }
    return NextResponse.json({ error: friendErr.message }, { status: 500 });
  }

  // Dados próprios — query direta (sem RPC)
  const [myProfile, friendProfile, myStats, mySkillsData, myWorkoutsData, myWeightData, skillNodes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, username, avatar_url').eq('id', user.id).single(),
    supabase.from('profiles').select('id, full_name, username, avatar_url').eq('id', id).single(),
    supabase.from('user_stats').select('level, current_streak, longest_streak, total_xp').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_skills').select('skill_key, status').eq('user_id', user.id),
    supabase.from('workout_logs').select('duration_sec, perceived_effort')
      .eq('user_id', user.id)
      .gte('started_at', since)
      .not('finished_at', 'is', null),
    supabase.from('weight_logs').select('weight_kg').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1),
    supabase.from('skill_nodes').select('key, name, icon, category'),
  ]);

  const myMasteredKeys = (mySkillsData.data || [])
    .filter((s: Record<string, unknown>) => s.status === 'mastered')
    .map((s: Record<string, unknown>) => s.skill_key as string);

  const mySkillCounts = (mySkillsData.data || []).reduce((acc: Record<string, number>, s: Record<string, unknown>) => {
    const st = s.status as string;
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const myWorkouts = myWorkoutsData.data || [];
  const myWorkoutCount = myWorkouts.length;
  const myTotalMin = myWorkouts.reduce((sum: number, w: Record<string, unknown>) => sum + Math.round((Number(w.duration_sec) || 0) / 60), 0);
  const myAvgEffort = myWorkoutCount > 0
    ? Math.round(myWorkouts.reduce((sum: number, w: Record<string, unknown>) => sum + (Number(w.perceived_effort) || 0), 0) / myWorkoutCount * 10) / 10
    : 0;

  return NextResponse.json({
    me: {
      ...myProfile.data,
      stats: {
        level: myStats.data?.level || 1,
        current_streak: myStats.data?.current_streak || 0,
        longest_streak: myStats.data?.longest_streak || 0,
        total_xp: myStats.data?.total_xp || 0,
      },
      workouts: { count: myWorkoutCount, total_minutes: myTotalMin, avg_effort: myAvgEffort },
      skills: { mastered: mySkillCounts.mastered || 0, in_progress: mySkillCounts.in_progress || 0, mastered_keys: myMasteredKeys },
      weight: myWeightData.data?.[0] ? { current: myWeightData.data[0].weight_kg } : null,
    },
    friend: {
      ...friendProfile.data,
      ...(friendRpc as Record<string, unknown> || {}),
    },
    skill_nodes: skillNodes.data || [],
    days,
  });
}
