import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('autopilot', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const today = new Date().toISOString().slice(0, 10);

    const { data: activeUsers } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(5000);

    const { data: alreadyHave } = await supabase
      .from('daily_plans')
      .select('user_id')
      .eq('plan_date', today);

    const alreadySet = new Set((alreadyHave || []).map((p: any) => p.user_id));
    const usersToGenerate = (activeUsers || []).filter((u: any) => !alreadySet.has(u.user_id)).slice(0, 200);

    console.log(`[cron/daily-autopilot] Gerando para ${usersToGenerate.length} usuários`);

    // Cache readiness & sleep scores for active users (avoids heavy queries on page load)
    let cached = 0;
    const { calculateReadiness } = await import('@/lib/health/readiness');
    const { calculateSleepScore } = await import('@/lib/health/sleep-score');

    for (const u of usersToGenerate) {
      try {
        const [readiness, sleep] = await Promise.all([
          calculateReadiness(u.user_id),
          calculateSleepScore(u.user_id),
        ]);
        await supabase
          .from('profiles')
          .update({
            cached_sleep_score: sleep.total,
            cached_readiness_score: readiness.score,
            cached_readiness_zone: readiness.zone,
            cached_scores_at: new Date().toISOString(),
          } as Record<string, unknown>)
          .eq('id', u.user_id);
        cached++;
      } catch {
        // non-critical — scores will be calculated on-demand
      }
    }

    return NextResponse.json({
      triggered: usersToGenerate.length,
      cached,
      message: 'Autopilots serão gerados sob demanda quando o usuário abrir o app',
    });
  });
}
