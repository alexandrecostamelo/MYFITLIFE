import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ goals: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    title,
    description,
    category,
    metric_type,
    target_value,
    unit,
    deadline,
    auto_track_source,
  } = body;

  if (!title)
    return NextResponse.json({ error: 'missing_title' }, { status: 400 });

  let startValue = 0;
  if (auto_track_source === 'weight_logs') {
    const { data } = await supabase
      .from('weight_logs')
      .select('weight_kg')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    startValue = data?.weight_kg ? Number(data.weight_kg) : 0;
  }

  const { data, error } = await supabase
    .from('user_goals')
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      category: category || 'custom',
      metric_type: metric_type || 'number',
      target_value: target_value || null,
      unit: unit || null,
      start_value: startValue,
      current_value: startValue,
      deadline: deadline || null,
      auto_track_source: auto_track_source || null,
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: data });
}
