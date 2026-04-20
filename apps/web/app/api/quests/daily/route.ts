import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { DAILY_QUESTS_SYSTEM, buildQuestsContext } from '@myfitlife/ai/prompts/quests';
import { buildSystemPrompt } from '@/lib/ai/personas';
import { checkDailyLimit, logUsage } from '@/lib/rate-limit';

export const maxDuration = 30;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from('daily_quests').select('*')
    .eq('user_id', user.id).eq('quest_date', today)
    .order('created_at', { ascending: true });

  if (existing && existing.length >= 3) return NextResponse.json({ quests: existing });

  const limit = await checkDailyLimit(user.id, 'daily_quests', 3);
  if (!limit.allowed) return NextResponse.json({ quests: existing || [] });

  const { data: profile } = await supabase.from('profiles').select('full_name, coach_persona').eq('id', user.id).single();
  const { data: up } = await supabase.from('user_profiles').select('primary_goal, experience_level').eq('user_id', user.id).single();
  const { data: stats } = await supabase.from('user_stats').select('level').eq('user_id', user.id).maybeSingle();
  const { data: activeTrail } = await supabase.from('user_trails').select('id').eq('user_id', user.id).is('completed_at', null).eq('abandoned', false).maybeSingle();

  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const [w7, m7, c7] = await Promise.all([
    supabase.from('workout_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('started_at', sevenDaysAgo.toISOString()),
    supabase.from('meal_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('logged_at', sevenDaysAgo.toISOString()),
    supabase.from('morning_checkins').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('checkin_date', sevenDaysAgo.toISOString().slice(0, 10)),
  ]);

  const weekdayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const context = buildQuestsContext({
    userName: profile?.full_name?.split(' ')[0] || 'atleta', level: stats?.level || 1,
    goal: up?.primary_goal || 'general_health', experienceLevel: up?.experience_level || 'beginner',
    weekdayName: weekdayNames[new Date().getDay()], hasActiveTrail: !!activeTrail,
    recentActivity: { workouts_7d: w7.count || 0, meals_7d: m7.count || 0, checkins_7d: c7.count || 0 },
  });

  const anthropic = getAnthropicClient();
  try {
    const personaId = String(profile?.coach_persona || 'leo');
    const response = await anthropic.messages.create({ model: CLAUDE_MODEL, max_tokens: 800, system: buildSystemPrompt(personaId, DAILY_QUESTS_SYSTEM), messages: [{ role: 'user', content: context }] });
    const text = response.content.filter((c) => c.type === 'text').map((c) => ('text' in c ? c.text : '')).join('\n');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'ai_no_json' }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]);
    const inserts = (parsed.quests || []).slice(0, 3).map((q: any) => ({
      user_id: user.id, quest_date: today, title: q.title, description: q.description,
      target_type: q.target_type, target_value: q.target_value || 1, xp_reward: q.xp_reward || 30,
    }));

    const { data: saved } = await supabase.from('daily_quests').upsert(inserts, { onConflict: 'user_id,quest_date,title' }).select();
    await logUsage(user.id, 'daily_quests', 1);
    return NextResponse.json({ quests: saved || [] });
  } catch (err) {
    console.error('[quests/daily]', err);
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }
}
