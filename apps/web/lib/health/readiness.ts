import { createClient as createAdmin } from '@supabase/supabase-js';

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export interface ReadinessResult {
  score: number;
  zone: 'green' | 'yellow' | 'red';
  hrv_score: number;
  rhr_score: number;
  sleep_score: number;
  volume_score: number;
  hrv_avg: number | null;
  hrv_baseline: number | null;
  rhr_avg: number | null;
  rhr_baseline: number | null;
  sleep_hours: number | null;
  training_load_7d: number;
  recommendation: string;
  factors: string[];
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function getMetricHistory(
  userId: string,
  metric: string,
  days: number,
): Promise<{ value: number; date: string }[]> {
  const supa = admin();
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const { data } = await supa
    .from('health_samples')
    .select('value, sampled_at')
    .eq('user_id', userId)
    .eq('metric', metric)
    .gte('sampled_at', since)
    .order('sampled_at', { ascending: true });
  return ((data || []) as Record<string, unknown>[]).map((d) => ({
    value: Number(d.value),
    date: String(d.sampled_at),
  }));
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

// ---------------------------------------------------------------------------
// sub-scores
// ---------------------------------------------------------------------------

function scoreHRV(
  recent: number[],
  baseline: number[],
): {
  score: number;
  avg: number;
  baselineAvg: number;
  factors: string[];
} {
  if (recent.length < 2)
    return {
      score: 50,
      avg: 0,
      baselineAvg: 0,
      factors: ['HRV: dados insuficientes'],
    };

  const recentAvg = avg(recent);
  const baselineAvg = avg(baseline);
  const factors: string[] = [];

  if (baselineAvg === 0)
    return {
      score: 50,
      avg: recentAvg,
      baselineAvg: 0,
      factors: ['HRV: baseline em construção'],
    };

  const pctChange = ((recentAvg - baselineAvg) / baselineAvg) * 100;

  let score: number;
  if (pctChange >= 5) {
    score = 90;
    factors.push('HRV acima do baseline');
  } else if (pctChange >= -5) {
    score = 70;
    factors.push('HRV dentro da normalidade');
  } else if (pctChange >= -15) {
    score = 45;
    factors.push('HRV abaixo do normal');
  } else {
    score = 20;
    factors.push('HRV significativamente abaixo');
  }

  // detect sustained decrease
  const last3 = recent.slice(-3);
  if (last3.length >= 3 && last3[2] < last3[1] && last3[1] < last3[0]) {
    score -= 10;
    factors.push('HRV em queda nos últimos 3 dias');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    avg: recentAvg,
    baselineAvg,
    factors,
  };
}

function scoreRHR(
  recent: number[],
  baseline: number[],
): {
  score: number;
  avg: number;
  baselineAvg: number;
  factors: string[];
} {
  if (recent.length < 2)
    return {
      score: 50,
      avg: 0,
      baselineAvg: 0,
      factors: ['FC Repouso: dados insuficientes'],
    };

  const recentAvg = avg(recent);
  const baselineAvg = avg(baseline);
  const factors: string[] = [];

  if (baselineAvg === 0)
    return {
      score: 50,
      avg: recentAvg,
      baselineAvg: 0,
      factors: ['FC Repouso: baseline em construção'],
    };

  const diff = recentAvg - baselineAvg;

  let score: number;
  if (diff <= -2) {
    score = 90;
    factors.push('FC repouso melhor que baseline');
  } else if (diff <= 3) {
    score = 70;
    factors.push('FC repouso normal');
  } else if (diff <= 7) {
    score = 40;
    factors.push('FC repouso elevada');
  } else {
    score = 15;
    factors.push('FC repouso muito elevada');
  }

  // detect sustained rise
  const last3 = recent.slice(-3);
  if (last3.length >= 3 && last3[2] > last3[1] && last3[1] > last3[0]) {
    score -= 10;
    factors.push('FC repouso subindo nos últimos 3 dias');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    avg: recentAvg,
    baselineAvg,
    factors,
  };
}

function scoreSleep(recentHours: number[]): {
  score: number;
  avg: number;
  factors: string[];
} {
  if (recentHours.length === 0)
    return { score: 50, avg: 0, factors: ['Sono: sem dados'] };

  const avgHours = avg(recentHours);
  const factors: string[] = [];
  let score: number;

  if (avgHours >= 7.5) {
    score = 90;
    factors.push(`${avgHours.toFixed(1)}h de sono — ótimo`);
  } else if (avgHours >= 6.5) {
    score = 70;
    factors.push(`${avgHours.toFixed(1)}h de sono — ok`);
  } else if (avgHours >= 5.5) {
    score = 40;
    factors.push(`${avgHours.toFixed(1)}h de sono — pouco`);
  } else {
    score = 15;
    factors.push(`${avgHours.toFixed(1)}h de sono — crítico`);
  }

  // consistency penalty
  if (recentHours.length >= 3) {
    const std = Math.sqrt(
      recentHours.reduce((s, h) => s + Math.pow(h - avgHours, 2), 0) /
        recentHours.length,
    );
    if (std > 1.5) {
      score -= 10;
      factors.push('Horários de sono inconsistentes');
    }
  }

  return { score: Math.max(0, Math.min(100, score)), avg: avgHours, factors };
}

function scoreVolume(
  load7d: number,
  load28d: number,
): { score: number; factors: string[] } {
  if (load28d === 0)
    return { score: 70, factors: ['Volume: sem histórico suficiente'] };

  const weeklyAvg = load28d / 4;
  const ratio = load7d / weeklyAvg;
  const factors: string[] = [];
  let score: number;

  if (ratio <= 0.8) {
    score = 90;
    factors.push('Volume de treino leve');
  } else if (ratio <= 1.1) {
    score = 75;
    factors.push('Volume de treino adequado');
  } else if (ratio <= 1.3) {
    score = 50;
    factors.push('Volume acima da média');
  } else if (ratio <= 1.5) {
    score = 30;
    factors.push('Volume alto — risco de overtraining');
  } else {
    score = 10;
    factors.push('Volume muito alto — overtraining provável');
  }

  return { score: Math.max(0, Math.min(100, score)), factors };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

export async function calculateReadiness(
  userId: string,
): Promise<ReadinessResult> {
  const [hrvRecent, hrvBaseline, rhrRecent, rhrBaseline, sleepRecent] =
    await Promise.all([
      getMetricHistory(userId, 'hrv', 7),
      getMetricHistory(userId, 'hrv', 30),
      getMetricHistory(userId, 'resting_heart_rate', 7),
      getMetricHistory(userId, 'resting_heart_rate', 30),
      getMetricHistory(userId, 'sleep_duration', 7),
    ]);

  const supa = admin();
  const sevenDays = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const twentyEightDays = new Date(
    Date.now() - 28 * 24 * 3600 * 1000,
  ).toISOString();

  const [{ data: workouts7 }, { data: workouts28 }] = await Promise.all([
    supa
      .from('workout_logs')
      .select('duration_minutes')
      .eq('user_id', userId)
      .gte('created_at', sevenDays),
    supa
      .from('workout_logs')
      .select('duration_minutes')
      .eq('user_id', userId)
      .gte('created_at', twentyEightDays),
  ]);

  const load7d = ((workouts7 || []) as Record<string, unknown>[]).reduce(
    (s, w) => s + Number(w.duration_minutes || 0),
    0,
  );
  const load28d = ((workouts28 || []) as Record<string, unknown>[]).reduce(
    (s, w) => s + Number(w.duration_minutes || 0),
    0,
  );

  const hrvResult = scoreHRV(
    hrvRecent.map((h) => h.value),
    hrvBaseline.map((h) => h.value),
  );
  const rhrResult = scoreRHR(
    rhrRecent.map((r) => r.value),
    rhrBaseline.map((r) => r.value),
  );
  const sleepResult = scoreSleep(sleepRecent.map((s) => s.value));
  const volumeResult = scoreVolume(load7d, load28d);

  // weighted composite
  const totalScore = Math.round(
    hrvResult.score * 0.35 +
      rhrResult.score * 0.25 +
      sleepResult.score * 0.25 +
      volumeResult.score * 0.15,
  );

  const zone: 'green' | 'yellow' | 'red' =
    totalScore >= 65 ? 'green' : totalScore >= 40 ? 'yellow' : 'red';

  const allFactors = [
    ...hrvResult.factors,
    ...rhrResult.factors,
    ...sleepResult.factors,
    ...volumeResult.factors,
  ];

  let recommendation: string;
  if (zone === 'green') {
    recommendation =
      'Corpo recuperado. Pode treinar com intensidade normal ou alta.';
  } else if (zone === 'yellow') {
    recommendation =
      'Sinais de fadiga. Prefira treino moderado, mobilidade ou cardio leve. Priorize sono.';
  } else {
    recommendation =
      'Alto risco de overtraining. Recomendo descanso completo ou apenas alongamento leve. Durma mais.';
  }

  // persist today's score
  const today = new Date().toISOString().slice(0, 10);
  await supa.from('readiness_scores').upsert(
    {
      user_id: userId,
      date: today,
      score: totalScore,
      zone,
      hrv_score: hrvResult.score,
      rhr_score: rhrResult.score,
      sleep_score: sleepResult.score,
      volume_score: volumeResult.score,
      hrv_avg: hrvResult.avg || null,
      hrv_baseline: hrvResult.baselineAvg || null,
      rhr_avg: rhrResult.avg || null,
      rhr_baseline: rhrResult.baselineAvg || null,
      sleep_hours: sleepResult.avg || null,
      training_load_7d: load7d,
      recommendation,
      factors: allFactors,
    } as Record<string, unknown>,
    { onConflict: 'user_id,date' },
  );

  return {
    score: totalScore,
    zone,
    hrv_score: hrvResult.score,
    rhr_score: rhrResult.score,
    sleep_score: sleepResult.score,
    volume_score: volumeResult.score,
    hrv_avg: hrvResult.avg || null,
    hrv_baseline: hrvResult.baselineAvg || null,
    rhr_avg: rhrResult.avg || null,
    rhr_baseline: rhrResult.baselineAvg || null,
    sleep_hours: sleepResult.avg || null,
    training_load_7d: load7d,
    recommendation,
    factors: allFactors,
  };
}
