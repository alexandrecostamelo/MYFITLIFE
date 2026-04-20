import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sevenDays = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const { data: samples } = await supabase
    .from('health_samples')
    .select('metric, value, unit, sampled_at')
    .eq('user_id', user.id)
    .gte('sampled_at', sevenDays)
    .order('sampled_at', { ascending: false });

  const summary: Record<
    string,
    { latest: number; avg7d: number; unit: string; trend: 'up' | 'down' | 'stable' }
  > = {};

  const byMetric: Record<string, { value: number; date: string; unit: string }[]> = {};
  for (const s of (samples || []) as Record<string, unknown>[]) {
    const metric = String(s.metric);
    if (!byMetric[metric]) byMetric[metric] = [];
    byMetric[metric].push({
      value: Number(s.value),
      date: String(s.sampled_at),
      unit: String(s.unit),
    });
  }

  for (const [metric, entries] of Object.entries(byMetric)) {
    const latest = entries[0].value;
    const avg =
      entries.reduce((s, e) => s + e.value, 0) / entries.length;
    const half = Math.floor(entries.length / 2);
    const firstHalf = entries.slice(half);
    const secondHalf = entries.slice(0, half);
    const avgFirst =
      firstHalf.length > 0
        ? firstHalf.reduce((s, e) => s + e.value, 0) / firstHalf.length
        : avg;
    const avgSecond =
      secondHalf.length > 0
        ? secondHalf.reduce((s, e) => s + e.value, 0) / secondHalf.length
        : avg;
    const diff = avgSecond - avgFirst;
    const trend: 'up' | 'down' | 'stable' =
      Math.abs(diff) < avg * 0.03 ? 'stable' : diff > 0 ? 'up' : 'down';

    summary[metric] = {
      latest: Math.round(latest * 10) / 10,
      avg7d: Math.round(avg * 10) / 10,
      unit: entries[0].unit,
      trend,
    };
  }

  return NextResponse.json({ summary });
}
