import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { PROACTIVE_COACH_SYSTEM, buildProactiveContext } from '@myfitlife/ai/prompts/lab-extraction';
import { buildSystemPrompt } from '@/lib/ai/personas';

export const maxDuration = 60;

async function detectTriggers(supabase: any, userId: string) {
  const today3d = new Date(Date.now() - 3 * 86400000);
  const today7d = new Date(Date.now() - 7 * 86400000);
  const today14d = new Date(Date.now() - 14 * 86400000);

  const [workouts3d, workouts14d, checkins7d, stats, lastWeights, criticalBio, profile] = await Promise.all([
    supabase.from('workout_logs').select('id').eq('user_id', userId).gte('started_at', today3d.toISOString()).not('finished_at', 'is', null),
    supabase.from('workout_logs').select('id').eq('user_id', userId).gte('started_at', today14d.toISOString()).not('finished_at', 'is', null),
    supabase.from('morning_checkins').select('sleep_quality, energy_level').eq('user_id', userId).gte('checkin_date', today7d.toISOString().slice(0, 10)),
    supabase.from('user_stats').select('current_streak, level').eq('user_id', userId).maybeSingle(),
    supabase.from('weight_logs').select('weight_kg, logged_at').eq('user_id', userId).order('logged_at', { ascending: false }).limit(4),
    supabase.from('biomarkers').select('marker_name, value, unit, status, measured_at').eq('user_id', userId).in('status', ['critical_low', 'critical_high']).order('measured_at', { ascending: false }).limit(3),
    supabase.from('profiles').select('full_name').eq('id', userId).single(),
  ]);

  const triggers: Array<{ type: string; data: any }> = [];
  const name = profile.data?.full_name?.split(' ')[0] || 'você';

  const w3 = workouts3d.data?.length || 0;
  const w14 = workouts14d.data?.length || 0;

  if (w3 === 0 && w14 > 0) {
    triggers.push({ type: 'inactivity_3d', data: { name, workouts_14d: w14 } });
  }

  if (checkins7d.data && checkins7d.data.length >= 3) {
    const avgSleep = checkins7d.data.reduce((a: number, c: any) => a + (c.sleep_quality || 0), 0) / checkins7d.data.length;
    const avgEnergy = checkins7d.data.reduce((a: number, c: any) => a + (c.energy_level || 0), 0) / checkins7d.data.length;
    if (avgSleep < 5 && avgEnergy < 5) {
      triggers.push({ type: 'poor_sleep_energy', data: { name, avg_sleep: avgSleep.toFixed(1), avg_energy: avgEnergy.toFixed(1) } });
    }
  }

  if (stats.data?.current_streak && stats.data.current_streak > 0 && stats.data.current_streak % 10 === 0) {
    triggers.push({ type: 'streak_milestone', data: { name, streak: stats.data.current_streak } });
  }

  if (lastWeights.data && lastWeights.data.length >= 3) {
    const weights = lastWeights.data.map((w: any) => Number(w.weight_kg));
    const max = Math.max(...weights);
    const min = Math.min(...weights);
    if (max - min < 0.3) {
      triggers.push({ type: 'weight_plateau', data: { name, last_weight: weights[0], entries: weights.length } });
    }
  }

  if (criticalBio.data && criticalBio.data.length > 0) {
    triggers.push({ type: 'critical_biomarker', data: { name, markers: criticalBio.data } });
  }

  return triggers;
}

async function hasRecentMessage(supabase: any, userId: string, triggerType: string): Promise<boolean> {
  const last3Days = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data } = await supabase
    .from('proactive_messages')
    .select('id')
    .eq('user_id', userId)
    .eq('trigger_type', triggerType)
    .gte('created_at', last3Days)
    .limit(1);
  return (data || []).length > 0;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const triggers = await detectTriggers(supabase, user.id);
  const { data: personaProfile } = await supabase.from('profiles').select('coach_persona').eq('id', user.id).single();
  const personaId = String(personaProfile?.coach_persona || 'leo');
  const anthropic = getAnthropicClient();
  const createdMessages: string[] = [];

  for (const trigger of triggers) {
    const hasRecent = await hasRecentMessage(supabase, user.id, trigger.type);
    if (hasRecent) continue;

    try {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 400,
        system: buildSystemPrompt(personaId, PROACTIVE_COACH_SYSTEM),
        messages: [{ role: 'user', content: buildProactiveContext(trigger.type, trigger.data) }],
      });

      const text = response.content.filter((c) => c.type === 'text').map((c) => ('text' in c ? c.text : '')).join('\n');
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;

      const parsed = JSON.parse(jsonMatch[0]);

      await supabase.from('proactive_messages').insert({
        user_id: user.id,
        trigger_type: trigger.type,
        title: parsed.title,
        content: parsed.content,
        severity: ['info', 'suggestion', 'warning'].includes(parsed.severity) ? parsed.severity : 'info',
        action_label: parsed.action_label || null,
        action_url: parsed.action_url || null,
      });

      createdMessages.push(trigger.type);
    } catch (err) {
      console.error('[proactive]', err);
    }
  }

  return NextResponse.json({ created: createdMessages, triggers_detected: triggers.map((t) => t.type) });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('proactive_messages')
    .select('*')
    .eq('user_id', user.id)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ messages: data || [] });
}
