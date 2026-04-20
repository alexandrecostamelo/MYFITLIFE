import { createClient as createAdmin } from '@supabase/supabase-js';

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function linearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0, r2: 0 };

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const mean = sumY / n;
  const ssRes = points.reduce(
    (s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2),
    0
  );
  const ssTot = points.reduce((s, p) => s + Math.pow(p.y - mean, 2), 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, r2 };
}

export interface WeightPredictionResult {
  targetWeight: number | null;
  predictedDate: string | null;
  dailyRate: number;
  confidence: 'high' | 'medium' | 'low';
  dataPoints: number;
  chartData: { date: string; value: number }[];
  chartProjection: { date: string; value: number }[];
}

export async function calculateWeightPrediction(
  userId: string
): Promise<WeightPredictionResult | null> {
  const supa = admin();

  const { data: profile } = await supa
    .from('user_profiles')
    .select('target_weight')
    .eq('user_id', userId)
    .maybeSingle();

  const targetWeight = profile?.target_weight ? Number(profile.target_weight) : null;

  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 3600 * 1000
  ).toISOString();
  const { data: entries } = await supa
    .from('weight_logs')
    .select('weight_kg, logged_at')
    .eq('user_id', userId)
    .gte('logged_at', ninetyDaysAgo)
    .order('logged_at', { ascending: true });

  if (!entries || entries.length < 3) return null;

  const baseDate = new Date(String(entries[0].logged_at)).getTime();
  const points = entries.map((e: Record<string, unknown>) => ({
    x:
      (new Date(String(e.logged_at)).getTime() - baseDate) /
      (24 * 3600 * 1000),
    y: Number(e.weight_kg),
  }));

  const { slope, r2 } = linearRegression(points);
  const dailyRate = slope;

  const confidence: 'high' | 'medium' | 'low' =
    r2 > 0.7 && entries.length >= 10
      ? 'high'
      : r2 > 0.4 && entries.length >= 5
        ? 'medium'
        : 'low';

  let predictedDate: string | null = null;
  const chartProjection: { date: string; value: number }[] = [];

  if (targetWeight && dailyRate !== 0) {
    const currentWeight = Number(entries[entries.length - 1].weight_kg);
    const diff = targetWeight - currentWeight;

    if ((diff > 0 && dailyRate > 0) || (diff < 0 && dailyRate < 0)) {
      const daysNeeded = Math.abs(diff / dailyRate);
      if (daysNeeded < 730) {
        const pred = new Date(Date.now() + daysNeeded * 24 * 3600 * 1000);
        predictedDate = pred.toISOString().slice(0, 10);

        const projSteps = Math.min(Math.ceil(daysNeeded), 180);
        const stepSize = daysNeeded / projSteps;
        for (let i = 1; i <= projSteps; i++) {
          const futureDate = new Date(
            Date.now() + stepSize * i * 24 * 3600 * 1000
          );
          const futureWeight = currentWeight + dailyRate * stepSize * i;
          chartProjection.push({
            date: futureDate.toISOString().slice(0, 10),
            value: Math.round(futureWeight * 10) / 10,
          });
        }
      }
    }
  }

  const chartData = entries.map((e: Record<string, unknown>) => ({
    date: String(e.logged_at).slice(0, 10),
    value: Number(e.weight_kg),
  }));

  await supa.from('weight_predictions').upsert(
    {
      user_id: userId,
      target_weight: targetWeight || 0,
      predicted_date: predictedDate,
      daily_rate_kg: Math.round(dailyRate * 1000) / 1000,
      confidence,
      data_points_used: entries.length,
      calculated_at: new Date().toISOString(),
    } as Record<string, unknown>,
    { onConflict: 'user_id' }
  );

  return {
    targetWeight,
    predictedDate,
    dailyRate: Math.round(dailyRate * 100) / 100,
    confidence,
    dataPoints: entries.length,
    chartData,
    chartProjection,
  };
}
