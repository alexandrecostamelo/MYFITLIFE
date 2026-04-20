import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('body_compositions')
    .select('*')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ records: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const measuredAt =
    body.measured_at || new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('body_compositions')
    .upsert(
      {
        user_id: user.id,
        measured_at: measuredAt,
        weight_kg: body.weight_kg || null,
        body_fat_pct: body.body_fat_pct || null,
        muscle_mass_kg: body.muscle_mass_kg || null,
        lean_mass_kg: body.lean_mass_kg || null,
        bone_mass_kg: body.bone_mass_kg || null,
        water_pct: body.water_pct || null,
        visceral_fat_level: body.visceral_fat_level || null,
        basal_metabolic_rate: body.basal_metabolic_rate || null,
        body_age: body.body_age || null,
        source: body.source || 'manual',
        notes: body.notes || null,
      } as Record<string, unknown>,
      { onConflict: 'user_id,measured_at,source' },
    )
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync body_fat_pct to health_samples
  if (body.body_fat_pct) {
    await supabase.from('health_samples').upsert(
      {
        user_id: user.id,
        metric: 'body_fat_pct',
        value: body.body_fat_pct,
        unit: '%',
        source: 'manual',
        sampled_at: `${measuredAt}T12:00:00Z`,
      } as Record<string, unknown>,
      { onConflict: 'user_id,metric,source,sampled_at' },
    );
  }

  // Sync weight to weight_logs
  if (body.weight_kg) {
    try {
      await supabase.from('weight_logs').insert({
        user_id: user.id,
        weight_kg: body.weight_kg,
        body_fat_percent: body.body_fat_pct || null,
        logged_at: `${measuredAt}T12:00:00Z`,
      } as Record<string, unknown>);
    } catch {
      // may already exist
    }
  }

  return NextResponse.json({ record: data });
}
