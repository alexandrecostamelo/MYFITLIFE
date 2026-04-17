import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const category = req.nextUrl.searchParams.get('category');
  const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase() || '';

  let query = supabase
    .from('exercises')
    .select('id, slug, name_pt, category, primary_muscles, equipment, difficulty')
    .limit(50);

  if (category) query = query.eq('category', category);
  if (q.length >= 2) query = query.ilike('name_pt', `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercises: data });
}
