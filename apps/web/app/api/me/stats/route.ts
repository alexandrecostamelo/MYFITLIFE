import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { xpToNextLevel } from '@myfitlife/core/gamification';
import { ensureUserStats } from '@/lib/gamification';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const stats = await ensureUserStats(supabase, user.id);
  if (!stats) return NextResponse.json({ error: 'stats_error' }, { status: 500 });

  const progression = xpToNextLevel(stats.total_xp || 0);

  const { data: recentEvents } = await supabase
    .from('xp_events')
    .select('event_type, xp_awarded, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({
    stats: {
      level: stats.level, total_xp: stats.total_xp,
      xp_to_next: progression.needed - progression.current,
      xp_level_progress: progression.progress,
      xp_current_in_level: progression.current,
      xp_needed_in_level: progression.needed,
      dimensions: { strength: stats.xp_strength, endurance: stats.xp_endurance, flexibility: stats.xp_flexibility, consistency: stats.xp_consistency, nutrition: stats.xp_nutrition },
      streak: { current: stats.current_streak, longest: stats.longest_streak, freezes_used: stats.freezes_used_this_month, freezes_max: 2 },
    },
    recent_events: recentEvents || [],
  });
}
