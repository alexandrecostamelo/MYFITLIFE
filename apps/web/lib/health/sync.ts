import { getHealthBridge, type HealthMetric, type HealthSample } from './bridge';
import { createClient } from '@/lib/supabase/client';

const METRICS_TO_SYNC: HealthMetric[] = [
  'steps',
  'heart_rate',
  'resting_heart_rate',
  'hrv',
  'active_calories',
  'sleep_duration',
  'weight',
  'body_fat_pct',
];

export async function syncHealth(
  userId: string
): Promise<{ synced: number; errors: number }> {
  const bridge = getHealthBridge();
  if (!bridge) return { synced: 0, errors: 0 };

  const available = await bridge.isAvailable();
  if (!available) return { synced: 0, errors: 0 };

  const supabase = createClient();
  const endDate = new Date();
  const startDate = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  let synced = 0;
  let errors = 0;

  for (const metric of METRICS_TO_SYNC) {
    try {
      const samples = await bridge.readSamples(metric, startDate, endDate);
      if (samples.length === 0) continue;

      const aggregated = aggregateSamples(metric, samples);

      for (const sample of aggregated) {
        const { error } = await supabase.from('health_samples').upsert(
          {
            user_id: userId,
            metric: sample.metric,
            value: sample.value,
            unit: sample.unit,
            source: sample.source,
            sampled_at: sample.sampled_at,
            metadata: sample.metadata || null,
          },
          { onConflict: 'user_id,metric,source,sampled_at' }
        );
        if (!error) synced++;
        else errors++;
      }
    } catch {
      errors++;
    }
  }

  await supabase
    .from('profiles')
    .update({
      last_health_sync: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', userId);

  return { synced, errors };
}

function aggregateSamples(
  metric: HealthMetric,
  samples: HealthSample[]
): HealthSample[] {
  // Sum-based metrics: aggregate per day
  if (['steps', 'active_calories'].includes(metric)) {
    const byDay: Record<string, HealthSample[]> = {};
    for (const s of samples) {
      const day = s.sampled_at.slice(0, 10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(s);
    }
    return Object.entries(byDay).map(([day, daySamples]) => ({
      metric,
      value: daySamples.reduce((sum, s) => sum + s.value, 0),
      unit: daySamples[0].unit,
      source: daySamples[0].source,
      sampled_at: `${day}T23:59:59Z`,
    }));
  }

  // Average-based metrics: average per day
  if (['heart_rate', 'resting_heart_rate', 'hrv'].includes(metric)) {
    const byDay: Record<string, HealthSample[]> = {};
    for (const s of samples) {
      const day = s.sampled_at.slice(0, 10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(s);
    }
    return Object.entries(byDay).map(([day, daySamples]) => ({
      metric,
      value:
        Math.round(
          (daySamples.reduce((sum, s) => sum + s.value, 0) /
            daySamples.length) *
            10
        ) / 10,
      unit: daySamples[0].unit,
      source: daySamples[0].source,
      sampled_at: `${day}T12:00:00Z`,
      metadata: { sample_count: daySamples.length },
    }));
  }

  // Everything else: pass through
  return samples;
}

export async function writeWeightToHealth(kg: number): Promise<void> {
  const bridge = getHealthBridge();
  if (!bridge) return;
  try {
    await bridge.writeWeight(kg, new Date());
  } catch {
    // silent fail on web
  }
}

export async function writeWorkoutToHealth(params: {
  type: string;
  startDate: Date;
  endDate: Date;
  calories: number;
}): Promise<void> {
  const bridge = getHealthBridge();
  if (!bridge) return;
  try {
    await bridge.writeWorkout(params);
  } catch {
    // silent fail on web
  }
}
