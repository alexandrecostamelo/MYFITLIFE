import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const key = req.nextUrl.searchParams.get('key');

  let query = supabase
    .from('biomarkers')
    .select('*')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false });

  if (key) query = query.eq('marker_key', key);

  const { data } = await query;

  const grouped: Record<string, any[]> = {};
  (data || []).forEach((b: any) => {
    if (!grouped[b.marker_key]) grouped[b.marker_key] = [];
    grouped[b.marker_key].push(b);
  });

  const summary = Object.entries(grouped).map(([k, values]) => ({
    key: k,
    name: values[0].marker_name,
    unit: values[0].unit,
    latest: values[0],
    history: values,
    trend: values.length >= 2 ? (values[0].value > values[1].value ? 'up' : values[0].value < values[1].value ? 'down' : 'flat') : 'flat',
  }));

  summary.sort((a, b) => {
    const rank = (s: string | null) => s?.startsWith('critical') ? 0 : (s === 'high' || s === 'low') ? 1 : 2;
    return rank(a.latest.status) - rank(b.latest.status);
  });

  return NextResponse.json({ markers: summary });
}
