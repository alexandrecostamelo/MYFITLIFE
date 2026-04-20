import { createClient as createAdmin } from '@supabase/supabase-js';

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export interface SleepScore {
  total: number;
  duration_score: number;
  quality_score: number;
  consistency_score: number;
  avg_hours: number;
  avg_quality: number;
  std_deviation_hours: number;
  label: string;
  tip: string;
}

export async function calculateSleepScore(
  userId: string,
  days: number = 7,
): Promise<SleepScore> {
  const supa = admin();
  const sinceDate = new Date(Date.now() - days * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  // Get sleep data from morning_checkins (sleep_hours + sleep_quality)
  const { data: checkins } = await supa
    .from('morning_checkins')
    .select('sleep_hours, sleep_quality')
    .eq('user_id', userId)
    .gte('checkin_date', sinceDate)
    .order('checkin_date', { ascending: false });

  const checkinRecs = (checkins || []) as Record<string, unknown>[];
  const hours = checkinRecs
    .map((c) => Number(c.sleep_hours))
    .filter((h) => h > 0);
  const qualities = checkinRecs
    .map((c) => Number(c.sleep_quality))
    .filter((q) => q > 0);

  // Also try health_samples for sleep_duration
  if (hours.length === 0) {
    const { data: sleepSamples } = await supa
      .from('health_samples')
      .select('value')
      .eq('user_id', userId)
      .eq('metric', 'sleep_duration')
      .gte('sampled_at', sinceDate + 'T00:00:00Z')
      .order('sampled_at', { ascending: false });

    for (const s of (sleepSamples || []) as Record<string, unknown>[]) {
      const v = Number(s.value);
      if (v > 0) hours.push(v);
    }
  }

  if (hours.length === 0 && qualities.length === 0) {
    return {
      total: 0,
      duration_score: 0,
      quality_score: 0,
      consistency_score: 0,
      avg_hours: 0,
      avg_quality: 0,
      std_deviation_hours: 0,
      label: 'Sem dados',
      tip: 'Registre seu sono no check-in matinal ou conecte um wearable.',
    };
  }

  const avgHours =
    hours.length > 0 ? hours.reduce((s, h) => s + h, 0) / hours.length : 0;
  const avgQuality =
    qualities.length > 0
      ? qualities.reduce((s, q) => s + q, 0) / qualities.length
      : 5;

  // Duration score (ideal 7-9h)
  let durationScore: number;
  if (avgHours >= 7 && avgHours <= 9) durationScore = 100;
  else if (avgHours >= 6.5 || avgHours <= 9.5) durationScore = 80;
  else if (avgHours >= 6) durationScore = 60;
  else if (avgHours >= 5) durationScore = 40;
  else durationScore = 20;

  // Quality score (0-10 scale)
  const qualityScore = Math.min(100, (avgQuality / 10) * 100);

  // Consistency score (std deviation of hours)
  let stdDev = 0;
  if (hours.length >= 3) {
    stdDev = Math.sqrt(
      hours.reduce((s, h) => s + Math.pow(h - avgHours, 2), 0) /
        hours.length,
    );
  }
  let consistencyScore: number;
  if (stdDev <= 0.5) consistencyScore = 100;
  else if (stdDev <= 1) consistencyScore = 80;
  else if (stdDev <= 1.5) consistencyScore = 60;
  else if (stdDev <= 2) consistencyScore = 40;
  else consistencyScore = 20;

  const total = Math.round(
    durationScore * 0.4 + qualityScore * 0.3 + consistencyScore * 0.3,
  );

  let label: string;
  let tip: string;
  if (total >= 80) {
    label = 'Excelente';
    tip = 'Continue assim! Seu sono est\u00e1 \u00f3timo.';
  } else if (total >= 60) {
    label = 'Bom';
    tip = 'Tente manter hor\u00e1rios mais regulares pra melhorar consist\u00eancia.';
  } else if (total >= 40) {
    label = 'Regular';
    tip = 'Durma ao menos 7h. Evite telas 1h antes de dormir.';
  } else {
    label = 'Ruim';
    tip = 'Priorize o sono. Sem descanso, treino e nutri\u00e7\u00e3o n\u00e3o funcionam.';
  }

  return {
    total,
    duration_score: durationScore,
    quality_score: qualityScore,
    consistency_score: consistencyScore,
    avg_hours: Math.round(avgHours * 10) / 10,
    avg_quality: Math.round(avgQuality * 10) / 10,
    std_deviation_hours: Math.round(stdDev * 10) / 10,
    label,
    tip,
  };
}
