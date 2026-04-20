import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const region = url.searchParams.get('region');
  const diet = url.searchParams.get('diet');
  const search = url.searchParams.get('q');
  const tag = url.searchParams.get('tag');
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('recipes')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('title');

  if (region) query = query.eq('region', region);
  if (diet) query = query.contains('diet', [diet]);
  if (tag) query = query.contains('tags', [tag]);
  if (search) query = query.ilike('title', `%${search}%`);

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    recipes: data || [],
    total: count || 0,
    page,
    pages: Math.ceil((count || 0) / limit),
  });
}
