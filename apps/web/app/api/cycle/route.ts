import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeCurrentPhase } from '@myfitlife/core/cycle';
import { z } from 'zod';

const schema = z.object({
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  symptoms: z.array(z.string()).optional(),
  flow_intensity: z.enum(['light', 'medium', 'heavy']).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [cycles, settings] = await Promise.all([
    supabase.from('menstrual_cycles').select('*').eq('user_id', user.id).order('period_start', { ascending: false }).limit(12),
    supabase.from('menstrual_settings').select('*').eq('user_id', user.id).maybeSingle(),
  ]);

  const last = cycles.data?.[0];
  const current = last && settings.data?.tracking_enabled
    ? computeCurrentPhase({
        lastPeriodStart: last.period_start,
        averageCycleLength: settings.data.average_cycle_length || 28,
        averagePeriodLength: settings.data.average_period_length || 5,
      })
    : null;

  return NextResponse.json({
    cycles: cycles.data || [],
    settings: settings.data,
    current_phase: current,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { error } = await supabase.from('menstrual_cycles').upsert({
    user_id: user.id,
    ...parsed.data,
  }, { onConflict: 'user_id,period_start' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
