import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const objective = req.nextUrl.searchParams.get('objective');
  const difficulty = req.nextUrl.searchParams.get('difficulty');
  const sort = req.nextUrl.searchParams.get('sort') || 'trending';

  const { data, error } = await supabase.rpc('discover_public_workouts', {
    p_objective: objective || null,
    p_difficulty: difficulty || null,
    p_sort: sort,
    p_limit: 30,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ workouts: data || [] });
}
