import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase() || '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
    .neq('id', user.id)
    .limit(20);

  return NextResponse.json({ results: data || [] });
}
