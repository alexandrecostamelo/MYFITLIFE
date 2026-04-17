import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase() || '';
  if (q.length < 2) return NextResponse.json({ foods: [] });

  const { data, error } = await supabase
    .from('foods')
    .select('id, name, calories_kcal, protein_g, carbs_g, fats_g, serving_size_g, serving_description')
    .ilike('name', `%${q}%`)
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ foods: data });
}
