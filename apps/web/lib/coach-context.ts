import type { SupabaseClient } from '@supabase/supabase-js';
import { computeCurrentPhase, cycleTrainingHints, cycleNutritionHints } from '@myfitlife/core/cycle';

type Client = SupabaseClient<any, any, any>;

export async function buildRichCoachContext(supabase: Client, userId: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);

  const [
    profileRes,
    upRes,
    statsRes,
    checkinRes,
    recentWorkouts,
    recentMeals,
    lastWeights,
    activeTrail,
    primaryGym,
    cycleSettings,
    cycleLast,
    criticalBio,
    unresolvedInjuries,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', userId).single(),
    supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('user_stats').select('level, current_streak, longest_streak').eq('user_id', userId).maybeSingle(),
    supabase.from('morning_checkins').select('sleep_quality, energy_level, mood, soreness_details').eq('user_id', userId).eq('checkin_date', today).maybeSingle(),
    supabase.from('workout_logs').select('id, duration_sec, perceived_effort').eq('user_id', userId).gte('started_at', sevenDaysAgo).not('finished_at', 'is', null),
    supabase.from('meal_logs').select('calories_kcal').eq('user_id', userId).gte('logged_at', sevenDaysAgo),
    supabase.from('weight_logs').select('weight_kg, logged_at').eq('user_id', userId).order('logged_at', { ascending: false }).limit(3),
    supabase.from('user_trails').select('current_day, trails(title, duration_days)').eq('user_id', userId).is('completed_at', null).eq('abandoned', false).maybeSingle(),
    supabase.from('user_gyms').select('name, gym_equipment(name)').eq('user_id', userId).eq('is_primary', true).maybeSingle(),
    supabase.from('menstrual_settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('menstrual_cycles').select('period_start').eq('user_id', userId).order('period_start', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('biomarkers').select('marker_name, value, unit, status').eq('user_id', userId).in('status', ['critical_low', 'critical_high', 'high', 'low']).order('measured_at', { ascending: false }).limit(5),
    supabase.from('morning_checkins').select('soreness_details').eq('user_id', userId).gte('checkin_date', threeDaysAgo).not('soreness_details', 'is', null).limit(3),
  ]);

  const profile = profileRes.data;
  const up = upRes.data;
  const stats = statsRes.data;
  const checkin = checkinRes.data;

  const firstName = profile?.full_name?.split(' ')[0] || 'atleta';
  const workoutsLast7d = recentWorkouts.data?.length || 0;
  const totalMinutesLast7d = (recentWorkouts.data || []).reduce((acc: number, w: any) => acc + Math.round((w.duration_sec || 0) / 60), 0);

  const avgCalsLast7d = recentMeals.data && recentMeals.data.length > 0
    ? Math.round(recentMeals.data.reduce((a: number, m: any) => a + Number(m.calories_kcal || 0), 0) / 7)
    : 0;

  const currentWeight = lastWeights.data?.[0]?.weight_kg;
  const weightDelta = lastWeights.data && lastWeights.data.length >= 2
    ? Math.round((Number(lastWeights.data[0].weight_kg) - Number(lastWeights.data[lastWeights.data.length - 1].weight_kg)) * 10) / 10
    : null;

  let cycleInfo = '';
  if (cycleSettings.data?.tracking_enabled && cycleLast.data) {
    try {
      const phase = computeCurrentPhase({
        lastPeriodStart: cycleLast.data.period_start,
        averageCycleLength: cycleSettings.data.average_cycle_length || 28,
        averagePeriodLength: cycleSettings.data.average_period_length || 5,
      });
      if (phase.phase !== 'unknown') {
        cycleInfo = `\n- Fase do ciclo hormonal: ${phase.phase} (dia ${phase.dayInCycle}). ${cycleTrainingHints(phase.phase)} ${cycleNutritionHints(phase.phase)}`;
      }
    } catch { /* ignore */ }
  }

  const injuryRegions = new Set<string>();
  (unresolvedInjuries.data || []).forEach((c: any) => {
    (c.soreness_details || []).forEach((s: any) => {
      if (s.intensity >= 3) injuryRegions.add(s.region);
    });
  });

  const bioAlerts = (criticalBio.data || []).map((b: any) => `${b.marker_name}: ${b.value}${b.unit} (${b.status})`).join('; ');

  const gymEquipmentCount = primaryGym.data ? (primaryGym.data.gym_equipment as any[] || []).length : 0;
  const gymInfo = primaryGym.data
    ? `academia principal: ${primaryGym.data.name} com ${gymEquipmentCount} aparelhos`
    : 'sem academia cadastrada';

  const trailInfo = activeTrail.data
    ? `trilha ativa: ${(activeTrail.data.trails as any)?.title}, dia ${activeTrail.data.current_day} de ${(activeTrail.data.trails as any)?.duration_days}`
    : 'sem trilha ativa';

  return `
DADOS EM TEMPO REAL DO USUÁRIO:
- Nome: ${firstName}
- Objetivo: ${up?.primary_goal || 'saúde geral'}
- Nível de experiência: ${up?.experience_level || 'iniciante'}
- Nível MyFitLife: ${stats?.level || 1}
- Streak atual: ${stats?.current_streak || 0} dias (recorde: ${stats?.longest_streak || 0})
- Meta calórica: ${up?.target_calories || 2000} kcal/dia, proteína ${up?.target_protein_g || 120}g

ATIVIDADE RECENTE (7 dias):
- ${workoutsLast7d} treinos concluídos, total de ${totalMinutesLast7d} min
- Média de ${avgCalsLast7d} kcal/dia registradas
${currentWeight ? `- Peso atual: ${currentWeight}kg ${weightDelta !== null ? `(${weightDelta > 0 ? '+' : ''}${weightDelta}kg nas últimas 3 pesagens)` : ''}` : ''}

CONTEXTO DE HOJE:
${checkin ? `- Check-in matinal: sono ${checkin.sleep_quality}/10, energia ${checkin.energy_level}/10, humor ${checkin.mood}/10` : '- Sem check-in matinal hoje'}
${injuryRegions.size > 0 ? `- Dores recentes nas regiões: ${Array.from(injuryRegions).join(', ')}` : ''}

PERSONALIZAÇÃO:
- ${gymInfo}
- ${trailInfo}
${up?.food_restrictions && up.food_restrictions.length > 0 ? `- Restrições alimentares: ${up.food_restrictions.join(', ')}` : ''}
${up?.injuries_notes ? `- Lesões ou notas médicas: ${up.injuries_notes}` : ''}
${cycleInfo}
${bioAlerts ? `- BIOMARCADORES FORA DO NORMAL: ${bioAlerts}` : ''}

Use essas informações pra personalizar sua resposta. Nunca invente dados. Se algum campo estiver vazio, apenas ignore.
`.trim();
}
